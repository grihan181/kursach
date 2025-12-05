import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_client import CollectorRegistry, Counter, generate_latest
from prometheus_client import multiprocess, CONTENT_TYPE_LATEST
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from .config import settings
from .models import Base
from .db import engine
from .routers import orders

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

registry = CollectorRegistry()
request_counter = Counter("http_requests_total", "Total HTTP requests", ["method", "path"], registry=registry)

multiprocess.MultiProcessCollector(registry)

resource = Resource.create({"service.name": settings.service_name})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=settings.otlp_endpoint))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

app = FastAPI(title="Order Service")


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    response = await call_next(request)
    request_counter.labels(method=request.method, path=request.url.path).inc()
    return response


@app.middleware("http")
async def tracing_middleware(request: Request, call_next):
    with tracer.start_as_current_span(f"{request.method} {request.url.path}"):
        return await call_next(request)


@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)


@app.get("/health", response_class=JSONResponse)
async def health():
    return {"status": "ok"}


@app.get("/metrics")
async def metrics():
    data = generate_latest(registry)
    return PlainTextResponse(data.decode("utf-8"), media_type=CONTENT_TYPE_LATEST)


app.include_router(orders.router)
