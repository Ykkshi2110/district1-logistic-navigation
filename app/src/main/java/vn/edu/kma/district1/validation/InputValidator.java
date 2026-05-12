package vn.edu.kma.district1.validation;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;

/**
 * Kiểm tra đầu vào CLI trước khi gọi dịch vụ tính toán.
 */
public final class InputValidator {

    public static final int MIN_DELIVERY_POINTS = 1;
    public static final int MAX_DELIVERY_POINTS = 5;

    private InputValidator() {}

    public static void validateNodeExists(Graph graph, String id) {
        Objects.requireNonNull(graph, "graph");
        Objects.requireNonNull(id, "id");
        if (!graph.containsNode(id)) {
            throw new AppException("Địa điểm không tồn tại: " + id);
        }
    }

    public static void validateDeliveryPoints(List<String> deliveryIds) {
        Objects.requireNonNull(deliveryIds, "deliveryIds");
        if (deliveryIds.size() < MIN_DELIVERY_POINTS || deliveryIds.size() > MAX_DELIVERY_POINTS) {
            throw new AppException("Số điểm giao phải từ " + MIN_DELIVERY_POINTS + " đến " + MAX_DELIVERY_POINTS + ".");
        }
        Set<String> unique = new HashSet<>();
        for (String id : deliveryIds) {
            if (!unique.add(Objects.requireNonNull(id, "deliveryId"))) {
                throw new AppException("Điểm giao bị trùng id: " + id);
            }
        }
    }
}
