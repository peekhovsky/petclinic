package victor.training.petclinic.rest;

import java.util.Locale;

import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** The only sort keys the owners grid accepts, each mapped to what it orders by. */
enum OwnerSort {
    NAME("o.lastName",
            "o.firstName"), ADDRESS("o.address"), CITY("o.city"), TELEPHONE("o.telephone"), PETS("size(o.pets)");

    private final String[] expressions;

    OwnerSort(String... expressions) {
        this.expressions = expressions;
    }

    /** Parses {@code key[,asc|desc]}; ties always fall back to the owner id so pages stay stable. */
    static Sort parse(String sortParam) {
        String[] parts = sortParam.split(",", -1);
        if (parts.length > 2) {
            throw badRequest("Expected sort=<column>[,asc|desc] but got: " + sortParam);
        }
        OwnerSort column = columnOf(parts[0]);
        Direction direction = parts.length == 2 ? directionOf(parts[1]) : Direction.ASC;
        return JpaSort.unsafe(direction, column.expressions).and(JpaSort.unsafe(direction, "o.id"));
    }

    private static OwnerSort columnOf(String key) {
        try {
            return valueOf(key.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw badRequest("Cannot sort owners by '" + key + "'");
        }
    }

    private static Direction directionOf(String direction) {
        return Direction.fromOptionalString(direction.trim())
                .orElseThrow(() -> badRequest("Sort direction must be asc or desc: " + direction));
    }

    private static ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
