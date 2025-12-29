package com.example.orders.service;

import com.example.orders.model.Order;
import com.example.orders.model.OrderStatusHistory;
import com.example.orders.repo.OrderRepository;
import com.example.orders.repo.OrderStageRepository;
import com.example.orders.repo.OrderStatusHistoryRepository;
import com.example.orders.service.dto.CreateOrderRequest;
import com.example.orders.service.dto.CreateStageRequest;
import com.example.orders.service.dto.DirectionInput;
import com.example.orders.service.dto.OrderHistoryEntryDto;
import com.example.orders.service.dto.OrderItem;
import com.example.orders.service.dto.OrderPermissionsDto;
import com.example.orders.service.dto.OrderStageDto;
import com.example.orders.service.dto.OrderView;
import com.example.orders.service.dto.PricingInput;
import com.example.orders.service.dto.UpdateOrderRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("created", "paid", "shipping", "delivered", "cancelled");

    private static final Map<String, String> COUNTRY_CATALOG = new LinkedHashMap<>();

    static {
        COUNTRY_CATALOG.put("RU", "Россия");
        COUNTRY_CATALOG.put("US", "США");
        COUNTRY_CATALOG.put("CN", "Китай");
        COUNTRY_CATALOG.put("DE", "Германия");
        COUNTRY_CATALOG.put("TR", "Турция");
        COUNTRY_CATALOG.put("KR", "Корея");
        COUNTRY_CATALOG.put("JP", "Япония");
        COUNTRY_CATALOG.put("AE", "ОАЭ");
        COUNTRY_CATALOG.put("IN", "Индия");
        COUNTRY_CATALOG.put("BR", "Бразилия");
    }

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final OrderStageRepository stageRepository;
    private final ObjectMapper objectMapper;
    private final PricingClient pricingClient;
    private final OrderEventsProducer eventsProducer;
    private final WarehouseService warehouseService;

    public OrderService(OrderRepository orderRepository,
                        OrderStatusHistoryRepository historyRepository,
                        OrderStageRepository stageRepository,
                        ObjectMapper objectMapper,
                        PricingClient pricingClient,
                        OrderEventsProducer eventsProducer,
                        WarehouseService warehouseService) {
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.stageRepository = stageRepository;
        this.objectMapper = objectMapper;
        this.pricingClient = pricingClient;
        this.eventsProducer = eventsProducer;
        this.warehouseService = warehouseService;
    }

    @Transactional
    public Order createOrder(String userId, String userEmail, CreateOrderRequest request) {
        validateItems(request.getItems());
        ResolvedDirection direction = resolveDirection(request.getDirection());
        Order order = new Order(userId, userEmail, writeItemsJson(request.getItems()));
        order.setRoute(buildRoute(direction));
        order.setOriginCountry(direction.originCode());
        order.setDestinationCountry(direction.destinationCode());
        if (request.getPricing() != null) {
            applyPricing(order, request.getPricing());
        }
        Order saved = orderRepository.save(order);
        UUID orderId = Optional.ofNullable(saved.getId()).orElseThrow(() -> new IllegalStateException("order id must be present"));
        String reference = OrderReferenceFormatter.referenceFor(orderId);
        appendHistory(orderId, userId, saved.getStatus());
        String orderTitle = resolveOrderTitle(saved);
        eventsProducer.orderCreated(
                orderId,
                reference,
                userId,
                userEmail,
                saved.getStatus(),
                saved.getRoute(),
                saved.getPrice(),
                saved.getCurrency(),
                orderTitle
        );
        return saved;
    }

    public List<Order> listOrders(String userId) {
        if (userId != null) {
            return orderRepository.findAllByUserId(userId);
        }
        return orderRepository.findAll();
    }

    public Order getOrder(UUID id) {
        return orderRepository.findById(id).orElse(null);
    }

    @Transactional
    public boolean deleteOrder(UUID id) {
        if (!orderRepository.existsById(id)) {
            return false;
        }
        historyRepository.deleteByOrderId(id);
        orderRepository.deleteById(id);
        return true;
    }

    @Transactional
    public Order updateStatus(Order order, String actorId, String status) {
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new IllegalArgumentException("недопустимый статус");
        }
        if (status.equals(order.getStatus())) {
            return order;
        }
        order.setStatus(status);
        Order saved = orderRepository.save(order);
        UUID orderId = Optional.ofNullable(saved.getId()).orElseThrow(() -> new IllegalStateException("order id must be present"));
        String reference = OrderReferenceFormatter.referenceFor(orderId);
        appendHistory(orderId, actorId, status);
        String orderTitle = resolveOrderTitle(saved);
        eventsProducer.orderStatusChanged(
                orderId,
                reference,
                order.getUserId(),
                order.getUserEmail(),
                status,
                actorId,
                orderTitle
        );
        return saved;
    }

    @Transactional
    public Order updateOrderDetails(Order order, UpdateOrderRequest request) {
        if (!"created".equals(order.getStatus())) {
            throw new IllegalArgumentException("Редактировать заказ можно только до оплаты");
        }
        if (request.getItems() != null) {
            validateItems(request.getItems());
            order.setItems(writeItemsJson(request.getItems()));
        }
        if (request.getDirection() != null) {
            ResolvedDirection resolved = resolveDirection(request.getDirection());
            order.setOriginCountry(resolved.originCode());
            order.setDestinationCountry(resolved.destinationCode());
            order.setRoute(buildRoute(resolved));
        }
        if (request.getPricing() != null) {
            applyPricing(order, request.getPricing());
        }
        return orderRepository.save(order);
    }

    public OrderView toView(Order order, String requesterId, boolean isAdmin, boolean includeHistory) {
        OrderPermissionsDto permissions = permissionsFor(order, requesterId, isAdmin);
        UUID orderId = Optional.ofNullable(order.getId()).orElseThrow(() -> new IllegalStateException("order id missing"));
        String reference = OrderReferenceFormatter.referenceFor(orderId);
        List<OrderHistoryEntryDto> history = null;
        List<OrderStageDto> stages = null;
        if (includeHistory) {
            List<OrderHistoryEntryDto> historyEntries = new ArrayList<>();
            historyRepository.findAllByOrderIdOrderByChangedAtAsc(orderId).forEach(entry -> {
                UUID historyId = Optional.ofNullable(entry.getId()).orElseThrow(() -> new IllegalStateException("history id missing"));
                historyEntries.add(new OrderHistoryEntryDto(historyId, entry.getStatus(), entry.getChangedAt(), entry.getChangedBy()));
            });
            history = historyEntries;
            var stageEntities = stageRepository.findAllByOrderIdOrderByHappenedAtAsc(orderId);
            Set<UUID> warehouseIds = new HashSet<>();
            stageEntities.forEach(stage -> {
                if (stage.getWarehouseId() != null) {
                    warehouseIds.add(stage.getWarehouseId());
                }
            });
            Map<UUID, com.example.orders.model.Warehouse> warehouseMap = warehouseService.findAllById(warehouseIds);
            stages = stageEntities.stream()
                    .map(stage -> {
                        var warehouse = stage.getWarehouseId() != null ? warehouseMap.get(stage.getWarehouseId()) : null;
                        String location = stage.getLocation();
                        if ((location == null || location.isBlank()) && warehouse != null) {
                            location = warehouseService.describe(warehouse);
                        }
                        return new OrderStageDto(
                                stage.getId(),
                                stage.getTitle(),
                                location,
                                stage.getNote(),
                                stage.getHappenedAt(),
                                stage.getWarehouseId(),
                                warehouse != null ? warehouse.getName() : null
                        );
                    })
                    .toList();
        }
        return new OrderView(
                orderId,
                reference,
                order.getUserId(),
                order.getUserEmail(),
                order.getStatus(),
                order.getItems(),
                order.getRoute(),
                order.getOriginCountry(),
                order.getDestinationCountry(),
                order.getPrice(),
                order.getCurrency(),
                order.getWeightKg(),
                order.getLengthCm(),
                order.getWidthCm(),
                order.getHeightCm(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                permissions,
                history,
                stages
        );
    }

    private String writeItemsJson(List<OrderItem> items) {
        try {
            return objectMapper.writeValueAsString(items);
        } catch (Exception ex) {
            throw new IllegalStateException("failed to serialize items", ex);
        }
    }

    private OrderPermissionsDto permissionsFor(Order order, String requesterId, boolean isAdmin) {
        boolean ownsOrder = requesterId != null && requesterId.equals(order.getUserId());
        return new OrderPermissionsDto(isAdmin, isAdmin || ownsOrder, isAdmin || ownsOrder);
    }

    private void applyPricing(Order order, PricingInput input) {
        validatePricing(input);
        order.setWeightKg(input.getWeightKg());
        order.setLengthCm(input.getLengthCm());
        order.setWidthCm(input.getWidthCm());
        order.setHeightCm(input.getHeightCm());
        if (input.getCurrency() != null) {
            order.setCurrency(input.getCurrency());
        }
        PricingClient.QuoteRequest request = new PricingClient.QuoteRequest(
                input.getWeightKg(),
                input.getLengthCm(),
                input.getWidthCm(),
                input.getHeightCm(),
                input.getOrigin(),
                input.getDestination(),
                input.getCurrency()
        );
        PricingClient.QuoteResponse quote = pricingClient.quote(request);
        if (quote != null) {
            order.setPrice(quote.getAmount());
            order.setCurrency(quote.getCurrency());
        }
    }

    private void validateItems(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("не заполнено описание отправления");
        }
    }

    private void validatePricing(PricingInput input) {
        resolveDirection(new DirectionInput(input.getOrigin(), input.getDestination()));
        if (input.getWeightKg() <= 0.0 || input.getLengthCm() <= 0.0 || input.getWidthCm() <= 0.0 || input.getHeightCm() <= 0.0) {
            throw new IllegalArgumentException("габариты и вес должны быть положительными");
        }
    }

    private ResolvedDirection resolveDirection(DirectionInput input) {
        String originCode = input.getOrigin().trim().toUpperCase();
        String destinationCode = input.getDestination().trim().toUpperCase();
        if (originCode.equals(destinationCode)) {
            throw new IllegalArgumentException("нужно выбрать разные страны маршрута");
        }
        String originName = COUNTRY_CATALOG.get(originCode);
        if (originName == null) {
            throw new IllegalArgumentException("страна отправления не поддерживается");
        }
        String destinationName = COUNTRY_CATALOG.get(destinationCode);
        if (destinationName == null) {
            throw new IllegalArgumentException("страна назначения не поддерживается");
        }
        return new ResolvedDirection(originCode, destinationCode, originName, destinationName);
    }

    private String buildRoute(ResolvedDirection direction) {
        return direction.originName() + " -> " + direction.destinationName();
    }

    private void appendHistory(UUID orderId, String actorId, String status) {
        historyRepository.save(new OrderStatusHistory(orderId, status, actorId));
    }

    private String resolveOrderTitle(Order order) {
        try {
            OrderItem[] parsed = objectMapper.readValue(order.getItems(), OrderItem[].class);
            if (parsed != null && parsed.length > 0) {
                String name = parsed[0].getName();
                if (name != null && !name.isBlank()) {
                    return name.trim();
                }
            }
        } catch (Exception ignored) {
        }
        String route = order.getRoute();
        if (route != null && !route.isBlank()) {
            return route;
        }
        UUID id = order.getId();
        return id != null ? "Заказ " + id : "Заказ";
    }

    @Transactional
    public OrderStageDto addStage(Order order, CreateStageRequest request) {
        com.example.orders.model.Warehouse warehouse = null;
        if (request.getWarehouseId() != null) {
            warehouse = warehouseService.findById(request.getWarehouseId())
                    .orElseThrow(() -> new IllegalArgumentException("Склад не найден"));
        }
        String location = request.getLocation();
        if (warehouse != null) {
            location = warehouseService.describe(warehouse);
        }
        var stage = stageRepository.save(new com.example.orders.model.OrderStage(
                order.getId(),
                request.getTitle(),
                location,
                request.getNote(),
                request.getHappenedAt(),
                warehouse != null ? warehouse.getId() : null
        ));
        String orderTitle = resolveOrderTitle(order);
        eventsProducer.orderStageAdded(
                order.getId(),
                OrderReferenceFormatter.referenceFor(order.getId()),
                order.getUserId(),
                order.getUserEmail(),
                orderTitle,
                stage.getTitle(),
                stage.getLocation(),
                stage.getNote(),
                stage.getHappenedAt(),
                stage.getWarehouseId(),
                warehouse != null ? warehouse.getName() : null
        );
        return new OrderStageDto(
                stage.getId(),
                stage.getTitle(),
                stage.getLocation(),
                stage.getNote(),
                stage.getHappenedAt(),
                stage.getWarehouseId(),
                warehouse != null ? warehouse.getName() : null
        );
    }

    private record ResolvedDirection(String originCode, String destinationCode, String originName, String destinationName) {
    }
}






