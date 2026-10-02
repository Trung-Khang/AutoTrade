package com.system.specification;

import com.system.dto.ListingFilterRequest;
import com.system.entity.Showroom;
import com.system.entity.Vehicle;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class VehicleSpecification {

    private VehicleSpecification() {
    }

    public static Specification<Vehicle> availableShowroomVehicles(ListingFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(criteriaBuilder.upper(root.get("status")), "AVAILABLE"));
            predicates.add(criteriaBuilder.isNotNull(root.get("showroomId")));

            if (filter == null) {
                return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
            }

            if (hasText(filter.getKeyword())) {
                String pattern = pattern(filter.getKeyword());
                Subquery<Long> showroomSubquery = showroomLocationSubquery(
                        query.subquery(Long.class), pattern, criteriaBuilder);
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("brand")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("model")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("variant"), "")), pattern),
                        root.get("showroomId").in(showroomSubquery)
                ));
            }

            if (filter.getVehicleId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("id"), filter.getVehicleId()));
            }
            addEqualIgnoreCase(predicates, root, "brand", filter.getBrand(), criteriaBuilder);
            addEqualIgnoreCase(predicates, root, "model", filter.getModel(), criteriaBuilder);
            addLikeIgnoreCase(predicates, root, "variant", filter.getVariant(), criteriaBuilder);
            addEqualIgnoreCase(predicates, root, "fuelType", filter.getFuelType(), criteriaBuilder);
            addEqualIgnoreCase(predicates, root, "transmission", filter.getTransmission(), criteriaBuilder);
            addEqualIgnoreCase(predicates, root, "bodyType", filter.getBodyType(), criteriaBuilder);
            addEqualIgnoreCase(predicates, root, "origin", filter.getOrigin(), criteriaBuilder);

            if (filter.getMinPrice() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
            }
            if (filter.getMaxPrice() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
            }
            if (filter.getMinYear() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("manufactureYear"), filter.getMinYear()));
            }
            if (filter.getMaxYear() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("manufactureYear"), filter.getMaxYear()));
            }
            if (filter.getMinMileage() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("mileage"), filter.getMinMileage()));
            }
            if (filter.getMaxMileage() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("mileage"), filter.getMaxMileage()));
            }
            if (hasText(filter.getLocation())) {
                predicates.add(root.get("showroomId").in(showroomLocationSubquery(
                        query.subquery(Long.class), pattern(filter.getLocation()), criteriaBuilder)));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Subquery<Long> showroomLocationSubquery(
            Subquery<Long> subquery, String pattern, jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder) {
        Root<Showroom> showroom = subquery.from(Showroom.class);
        subquery.select(showroom.get("id")).where(criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(showroom.get("name")), pattern),
                criteriaBuilder.like(criteriaBuilder.lower(showroom.get("address")), pattern),
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(showroom.get("city"), "")), pattern)
        ));
        return subquery;
    }

    private static void addEqualIgnoreCase(List<Predicate> predicates, Root<Vehicle> root, String field,
                                           String value, jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder) {
        if (hasText(value)) {
            predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get(field)), value.trim().toLowerCase()));
        }
    }

    private static void addLikeIgnoreCase(List<Predicate> predicates, Root<Vehicle> root, String field,
                                          String value, jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder) {
        if (hasText(value)) {
            predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(criteriaBuilder.coalesce(root.get(field), "")), pattern(value)));
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String pattern(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }
}
