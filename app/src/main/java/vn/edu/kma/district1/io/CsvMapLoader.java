package vn.edu.kma.district1.io;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.logging.Level;
import java.util.logging.Logger;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;

/**
 * Đọc bản đồ dạng CSV (header + dòng dữ liệu, dòng comment bắt đầu bằng '#').
 */
public final class CsvMapLoader {

    public static final int EXPECTED_COLUMN_COUNT = 11;

    private static final Logger LOG = Logger.getLogger(CsvMapLoader.class.getName());

    private CsvMapLoader() {}

    public static Graph load(String filePath) {
        Path path = Path.of(filePath);
        if (!Files.isRegularFile(path)) {
            throw new AppException("Không tìm thấy file bản đồ: " + path.toAbsolutePath());
        }
        Graph graph = new Graph();
        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String line;
            boolean first = true;
            while ((line = reader.readLine()) != null) {
                line = line.strip();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                if (first) {
                    first = false;
                    continue;
                }
                parseDataLine(line, graph);
            }
        } catch (IOException e) {
            throw new AppException("Không đọc được file: " + path.toAbsolutePath() + " — " + e.getMessage());
        }
        return graph;
    }

    private static void parseDataLine(String line, Graph graph) {
        String[] parts = line.split(",");
        if (parts.length < EXPECTED_COLUMN_COUNT) {
            LOG.log(Level.WARNING, "Bỏ qua dòng thiếu cột ({0} < {1}): {2}",
                    new Object[] {parts.length, EXPECTED_COLUMN_COUNT, line});
            return;
        }
        String fromId = parts[0].strip();
        String toId = parts[1].strip();
        String fromName = parts[2].strip();
        String toName = parts[3].strip();
        double distanceMeters;
        double speedKmh;
        double fromLat;
        double fromLng;
        double toLat;
        double toLng;

        try {
            distanceMeters = Double.parseDouble(parts[4].strip());
            speedKmh = Double.parseDouble(parts[5].strip());
            fromLat = Double.parseDouble(parts[7].strip());
            fromLng = Double.parseDouble(parts[8].strip());
            toLat = Double.parseDouble(parts[9].strip());
            toLng = Double.parseDouble(parts[10].strip());
        } catch (NumberFormatException ex) {
            LOG.log(Level.WARNING, "Bỏ qua dòng không parse được số: {0}", line);
            return;
        }
        if (distanceMeters <= 0 || speedKmh <= 0) {
            LOG.log(Level.WARNING, "Bỏ qua dòng có khoảng cách/tốc độ không dương: {0}", line);
            return;
        }
        boolean oneWay = parseBoolean(parts[6].strip());
        graph.addNode(fromId, fromName, fromLat, fromLng);
        graph.addNode(toId, toName, toLat, toLng);
        graph.addEdge(fromId, toId, distanceMeters, speedKmh, oneWay);
    }

    private static boolean parseBoolean(String raw) {
        return raw.equalsIgnoreCase("true") || raw.equals("1") || raw.equalsIgnoreCase("yes");
    }
}
