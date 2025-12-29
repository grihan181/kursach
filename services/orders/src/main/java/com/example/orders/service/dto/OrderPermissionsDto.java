package com.example.orders.service.dto;

public class OrderPermissionsDto {
    private final boolean canChangeStatus;
    private final boolean canEdit;
    private final boolean canDelete;

    public OrderPermissionsDto(boolean canChangeStatus, boolean canEdit, boolean canDelete) {
        this.canChangeStatus = canChangeStatus;
        this.canEdit = canEdit;
        this.canDelete = canDelete;
    }

    public boolean isCanChangeStatus() {
        return canChangeStatus;
    }

    public boolean isCanEdit() {
        return canEdit;
    }

    public boolean isCanDelete() {
        return canDelete;
    }
}
