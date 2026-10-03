package com.system.specification;

import com.system.dto.ListingFilterRequest;
import com.system.entity.Listing;
import com.system.entity.Vehicle;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ListingSpecification {

    public static Specification<Listing> filterBy(ListingFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            if (filter == null) {
                return criteriaBuilder.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();

            Join<Listing, Vehicle> vehicleJoin = root.join("vehicle", JoinType.LEFT);

            //Keyword search (tìm kiếm tự do trong brand, model, variant, location)
            if (filter.getKeyword() != null && !filter.getKeyword().trim().isEmpty()) {
                String pattern = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                Predicate keywordPredicate = criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(vehicleJoin.get("brand")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(vehicleJoin.get("model")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(vehicleJoin.get("variant"), "")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("location"), "")), pattern)
                );
                predicates.add(keywordPredicate);
            }

            //Vehicle ID
            if (filter.getVehicleId() != null) {
                predicates.add(criteriaBuilder.equal(vehicleJoin.get("id"), filter.getVehicleId()));
            }

            if (filter.getShowroomId() != null) {
                predicates.add(criteriaBuilder.equal(vehicleJoin.get("showroomId"), filter.getShowroomId()));
            }
            if (Boolean.TRUE.equals(filter.getShowroomUnassigned())) {
                predicates.add(criteriaBuilder.isNull(vehicleJoin.get("showroomId")));
            }

            //Hãng xe (Brand)
            if (filter.getBrand() != null && !filter.getBrand().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(vehicleJoin.get("brand")),
                        filter.getBrand().trim().toLowerCase()
                ));
            }

            //Dòng xe (Model)
            if (filter.getModel() != null && !filter.getModel().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(vehicleJoin.get("model")),
                        filter.getModel().trim().toLowerCase()
                ));
            }

            //Phiên bản (Variant)
            if (filter.getVariant() != null && !filter.getVariant().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(vehicleJoin.get("variant")),
                        "%" + filter.getVariant().trim().toLowerCase() + "%"
                ));
            }

            //Khoảng giá (Price min / max)
            if (filter.getMinPrice() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
            }
            if (filter.getMaxPrice() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
            }

            //Khoảng năm sản xuất (Manufacture Year min / max)
            if (filter.getMinYear() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(vehicleJoin.get("manufactureYear"), filter.getMinYear()));
            }
            if (filter.getMaxYear() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(vehicleJoin.get("manufactureYear"), filter.getMaxYear()));
            }

            //Khoảng số km đã đi (Mileage min / max)
            if (filter.getMinMileage() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("mileage"), filter.getMinMileage()));
            }
            if (filter.getMaxMileage() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("mileage"), filter.getMaxMileage()));
            }

            //Loại nhiên liệu (Fuel Type: Gasoline, Diesel, Hybrid, Electric)
            if (filter.getFuelType() != null && !filter.getFuelType().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(vehicleJoin.get("fuelType")),
                        filter.getFuelType().trim().toLowerCase()
                ));
            }

            //Hộp số (Transmission: Automatic, Manual, CVT)
            if (filter.getTransmission() != null && !filter.getTransmission().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(vehicleJoin.get("transmission")),
                        filter.getTransmission().trim().toLowerCase()
                ));
            }

            //Kiểu dáng (Body Type: Sedan, SUV / Crossover...)
            if (filter.getBodyType() != null && !filter.getBodyType().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(vehicleJoin.get("bodyType")),
                        filter.getBodyType().trim().toLowerCase()
                ));
            }

            //Xuất xứ (Origin: Domestic, Imported)
            if (filter.getOrigin() != null && !filter.getOrigin().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(vehicleJoin.get("origin")),
                        filter.getOrigin().trim().toLowerCase()
                ));
            }

            //Địa điểm / Tỉnh thành (Location)
            if (filter.getLocation() != null && !filter.getLocation().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("location")),
                        "%" + filter.getLocation().trim().toLowerCase() + "%"
                ));
            }

            if (filter.getStatus() != null && !filter.getStatus().trim().isEmpty()
                    && !"ALL".equalsIgnoreCase(filter.getStatus().trim())) {
                String status = filter.getStatus().trim().toUpperCase();
                if ("AVAILABLE".equals(status)) {
                    predicates.add(vehicleJoin.get("status").in("AVAILABLE", "ARCHIVED"));
                } else {
                    predicates.add(criteriaBuilder.equal(vehicleJoin.get("status"), status));
                }
            }

            if (Boolean.TRUE.equals(filter.getDepositEligible())) {
                predicates.add(criteriaBuilder.isNotNull(vehicleJoin.get("showroomId")));
                predicates.add(criteriaBuilder.equal(vehicleJoin.get("status"), "AVAILABLE"));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
