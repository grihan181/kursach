package com.example.orders.service;

import com.example.orders.model.Warehouse;
import com.example.orders.repo.WarehouseRepository;
import com.example.orders.service.dto.WarehouseView;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public WarehouseService(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    public List<WarehouseView> list() {
        return warehouseRepository
                .findAll(Sort.by(Sort.Order.asc("countryName"), Sort.Order.asc("city"), Sort.Order.asc("name")))
                .stream()
                .map(this::toView)
                .toList();
    }

    public Optional<Warehouse> findById(UUID id) {
        return warehouseRepository.findById(id);
    }

    public Map<UUID, Warehouse> findAllById(Collection<UUID> ids) {
        Map<UUID, Warehouse> map = new HashMap<>();
        if (ids == null || ids.isEmpty()) {
            return map;
        }
        warehouseRepository.findAllById(ids).forEach(warehouse -> map.put(warehouse.getId(), warehouse));
        return map;
    }

    public WarehouseView toView(Warehouse warehouse) {
        return new WarehouseView(
                warehouse.getId(),
                warehouse.getCode(),
                warehouse.getName(),
                warehouse.getCountryCode(),
                warehouse.getCountryName(),
                warehouse.getCity(),
                warehouse.getAddress(),
                warehouse.getContactPhone(),
                warehouse.getWorkingHours()
        );
    }

    public String describe(Warehouse warehouse) {
        return warehouse.getName() + " · " + warehouse.getCity() + ", " + warehouse.getCountryName();
    }
}
