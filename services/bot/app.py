import asyncio
import json
import logging
import os
from collections import defaultdict
from contextlib import suppress
from pathlib import Path
from typing import Dict, Optional

import httpx
from aiokafka import AIOKafkaConsumer
from telegram import BotCommand, Update
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(name)s: %(message)s')
logger = logging.getLogger("delivery-bot")

TELEGRAM_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
AUTH_SERVICE_URL = os.environ.get('AUTH_SERVICE_URL', 'http://auth:8080')
BFF_BASE_URL = os.environ.get('BFF_BASE_URL', 'http://bff:3000/api')
KAFKA_BROKERS = os.environ.get('KAFKA_BROKERS', 'kafka:9092')
KAFKA_TOPICS = [topic.strip() for topic in os.environ.get('BOT_KAFKA_TOPICS', 'order.status.changed,order.stage.changed').split(',') if topic.strip()]
KAFKA_GROUP_ID = os.environ.get('BOT_KAFKA_GROUP_ID', 'telegram-delivery-bot')
SESSION_FILE = Path(os.environ.get('SESSION_FILE', '/data/sessions.json'))
REQUEST_TIMEOUT = float(os.environ.get('HTTP_TIMEOUT', '5'))

if not TELEGRAM_TOKEN:
    raise RuntimeError('TELEGRAM_BOT_TOKEN env is required')

STATUS_LABELS = {
    'created': 'Создан',
    'paid': 'Оплачен',
    'shipping': 'В пути',
    'delivered': 'Доставлен',
    'cancelled': 'Отменён'
}

sessions: Dict[int, dict] = {}
user_index: Dict[str, set[int]] = defaultdict(set)
session_lock = asyncio.Lock()
http_client: Optional[httpx.AsyncClient] = None


def build_help_text() -> str:
    return (
        'Привет! Я бот сервиса доставки.\n'
        'Команды:\n'
        '/login email пароль - авторизация с данными сервиса.\n'
        '/orders — список активных заказов.\n'
        '/logout — выйти и перестать получать уведомления.\n'
        'После входа я пришлю уведомления о смене статуса и этапов доставки.'
    )


def localize_status(value: Optional[str]) -> str:
    if not value:
        return 'Неизвестно'
    key = str(value).lower()
    return STATUS_LABELS.get(key, value)


def resolve_order_name(event: dict) -> str:
    candidate = event.get('orderTitle') or event.get('route')
    if candidate:
        text = str(candidate).strip()
        if text:
            return text
    reference = event.get('reference')
    if reference:
        return reference
    order_id = event.get('id') or event.get('orderId')
    return order_id or 'Заказ'


def load_sessions() -> None:
    if not SESSION_FILE.exists():
        return
    try:
        data = json.loads(SESSION_FILE.read_text())
        for chat_id_str, payload in data.items():
            chat_id = int(chat_id_str)
            sessions[chat_id] = payload
            user_id = payload.get('userId')
            if user_id:
                user_index[user_id].add(chat_id)
        logger.info('Loaded %d bot sessions', len(sessions))
    except Exception as err:
        logger.error('Failed to load sessions file: %s', err)


def persist_sessions() -> None:
    try:
        SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = {str(chat_id): payload for chat_id, payload in sessions.items()}
        SESSION_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    except Exception as err:
        logger.error('Failed to persist sessions: %s', err)


def register_session(chat_id: int, payload: dict) -> None:
    sessions[chat_id] = payload
    user_id = payload.get('userId')
    if user_id:
        user_index[user_id].add(chat_id)
    persist_sessions()


def drop_session(chat_id: int) -> None:
    payload = sessions.pop(chat_id, None)
    if payload and payload.get('userId') in user_index:
        user_index[payload['userId']].discard(chat_id)
        if not user_index[payload['userId']]:
            user_index.pop(payload['userId'], None)
    persist_sessions()


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(build_help_text())


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(build_help_text())


async def cmd_login(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args or len(context.args) < 2:
        await update.message.reply_text('Использование: /login email@example.com пароль')
        return
    email = context.args[0]
    password = ' '.join(context.args[1:])
    if http_client is None:
        await update.message.reply_text('Сервис авторизации недоступен, попробуйте позже')
        return
    try:
        response = await http_client.post(
            f"{AUTH_SERVICE_URL}/auth/login",
            json={'email': email, 'password': password}
        )
        response.raise_for_status()
    except httpx.HTTPError as err:
        await update.message.reply_text(f'Ошибка входа: {err.response.text if err.response else err}')
        return
    data = response.json()
    user = data.get('user') or {'id': data.get('id'), 'email': data.get('email'), 'role': data.get('role')}
    session = {
        'userId': user.get('id'),
        'email': user.get('email'),
        'accessToken': data.get('accessToken'),
        'refreshToken': data.get('refreshToken')
    }
    async with session_lock:
        register_session(update.effective_chat.id, session)
    await update.message.reply_text('Вход выполнен. Я пришлю уведомление при изменении заказа.')


async def cmd_logout(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    async with session_lock:
        if update.effective_chat.id in sessions:
            drop_session(update.effective_chat.id)
            await update.message.reply_text('Сессия удалена.')
        else:
            await update.message.reply_text('Вы ещё не вошли.')


async def ensure_token(chat_id: int, session: dict) -> Optional[str]:
    if http_client is None:
        return None
    headers = {'Content-Type': 'application/json'}
    try:
        resp = await http_client.post(
            f"{AUTH_SERVICE_URL}/auth/refresh",
            json={'refreshToken': session['refreshToken']},
            headers=headers
        )
        resp.raise_for_status()
        data = resp.json()
        session['accessToken'] = data.get('accessToken')
        session['refreshToken'] = data.get('refreshToken')
        session['userId'] = data.get('user', {}).get('id', session['userId'])
        session['email'] = data.get('user', {}).get('email', session.get('email'))
        register_session(chat_id, session)
        return session['accessToken']
    except Exception as err:
        logger.error('Failed to refresh token for chat %s: %s', chat_id, err)
        return None


async def cmd_orders(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    async with session_lock:
        session = sessions.get(chat_id)
    if not session:
        await update.message.reply_text('Сначала выполните /login email пароль')
        return
    if http_client is None:
        await update.message.reply_text('Сервис недоступен, попробуйте позже')
        return
    token = session.get('accessToken')
    if not token:
        token = await ensure_token(chat_id, session)
        if not token:
            await update.message.reply_text('Не удалось обновить токен, выполните /login заново')
            return
    resp = await http_client.get(
        f"{BFF_BASE_URL}/orders",
        headers={'Authorization': f'Bearer {token}'}
    )
    if resp.status_code == 401:
        token = await ensure_token(chat_id, session)
        if not token:
            await update.message.reply_text('Токен истёк, выполните /login заново')
            return
        resp = await http_client.get(
            f"{BFF_BASE_URL}/orders",
            headers={'Authorization': f'Bearer {token}'}
        )
    if resp.is_error:
        await update.message.reply_text(f'Ошибка запроса заказов: {resp.text}')
        return
    orders = resp.json()
    if not orders:
        await update.message.reply_text('Заказы не найдены')
        return
    lines = []
    for order in orders[:10]:
        status = order.get('status')
        title = order.get('title') or order.get('id')
        route = order.get('route') or 'маршрут не указан'
        lines.append(f"• {title} — {status}\n  {route}")
    await update.message.reply_text('\n'.join(lines))


async def register_bot_commands(application: Application) -> None:
    commands = [
        BotCommand('start', 'краткая справка'),
        BotCommand('login', 'войти: /login email пароль'),
        BotCommand('orders', 'показать мои заказы'),
        BotCommand('logout', 'выйти из бота'),
        BotCommand('help', 'описание команд'),
    ]
    try:
        await application.bot.set_my_commands(commands)
    except Exception as err:
        logger.warning('Failed to publish bot commands: %s', err)


async def consume_kafka(app: Application) -> None:
    if not KAFKA_TOPICS:
        logger.warning('Kafka topics not configured, skipping consumer')
        return
    consumer = AIOKafkaConsumer(
        *KAFKA_TOPICS,
        bootstrap_servers=KAFKA_BROKERS.split(','),
        group_id=KAFKA_GROUP_ID,
        auto_offset_reset='latest'
    )
    await consumer.start()
    logger.info('Kafka consumer started on topics %s', KAFKA_TOPICS)
    try:
        async for msg in consumer:
            try:
                event = json.loads(msg.value.decode('utf-8'))
            except json.JSONDecodeError:
                logger.warning('Failed to decode Kafka message: %s', msg.value)
                continue
            await dispatch_event(app, event)
    except Exception as err:
        logger.error('Kafka consumer error: %s', err)
    finally:
        await consumer.stop()


async def dispatch_event(app: Application, event: dict) -> None:
    user_id = event.get('userId') or event.get('user_id')
    if not user_id:
        return
    async with session_lock:
        targets = list(user_index.get(user_id, []))
    if not targets:
        return
    if event.get('status'):
        text = format_status_message(event)
    else:
        text = format_stage_message(event)
    for chat_id in targets:
        try:
            await app.bot.send_message(chat_id=chat_id, text=text)
        except Exception as err:
            logger.error('Failed to send telegram notification to %s: %s', chat_id, err)


def format_status_message(event: dict) -> str:
    status = localize_status(event.get('status'))
    order_name = resolve_order_name(event)
    lines = [f'Заявка "{order_name}": статус сменился на {status}']
    if event.get('route'):
        lines.append(f"Маршрут: {event['route']}")
    if event.get('price') and event.get('currency'):
        lines.append(f"Сумма: {event['price']} {event['currency']}")
    return '\n'.join(lines)


def format_stage_message(event: dict) -> str:
    title = event.get('title') or 'Этап'
    order_name = resolve_order_name(event)
    lines = [f'Заявка "{order_name}": новый этап "{title}"']
    if event.get('location'):
        lines.append(f"Локация: {event['location']}")
    if event.get('note'):
        lines.append(event['note'])
    return '\n'.join(lines)


async def main() -> None:
    global http_client
    load_sessions()
    application = Application.builder().token(TELEGRAM_TOKEN).post_init(register_bot_commands).build()
    application.add_handler(CommandHandler('start', cmd_start))
    application.add_handler(CommandHandler('help', cmd_help))
    application.add_handler(CommandHandler('login', cmd_login))
    application.add_handler(CommandHandler('logout', cmd_logout))
    application.add_handler(CommandHandler('orders', cmd_orders))

    http_client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT)
    kafka_task: Optional[asyncio.Task] = None
    try:
        async with application:
            kafka_task = asyncio.create_task(consume_kafka(application))
            await application.start()
            await application.updater.start_polling()
            stop_future = asyncio.Future()
            try:
                await stop_future
            except asyncio.CancelledError:
                stop_future.cancel()
                raise
    except asyncio.CancelledError:
        pass
    finally:
        if kafka_task:
            kafka_task.cancel()
            with suppress(asyncio.CancelledError):
                await kafka_task
        if http_client:
            await http_client.aclose()
            http_client = None


if __name__ == '__main__':
    asyncio.run(main())
