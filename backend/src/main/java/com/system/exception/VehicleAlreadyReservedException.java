package com.system.exception;

public class VehicleAlreadyReservedException extends RuntimeException {
    public VehicleAlreadyReservedException(String message) {
        super(message);
    }
}
