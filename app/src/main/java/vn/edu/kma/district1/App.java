package vn.edu.kma.district1;

import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Objects;
import vn.edu.kma.district1.io.CsvMapLoader;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.ui.ConsoleUI;
import vn.edu.kma.district1.web.WebServer;

public class App {

    public static void main(String[] args) throws Exception {
        String mapPath = resolveMapPath(args);
        Graph graph = CsvMapLoader.load(mapPath);

        boolean webMode = args.length == 0
            || Arrays.stream(args).anyMatch("--web"::equals);

        if (webMode) {
            new WebServer(graph).start();
            // Giữ main thread sống — WebServer dùng virtual threads, không block tự động
            Thread.currentThread().join();
        } else {
            new ConsoleUI(graph).run();
        }
    }

    private static String resolveMapPath(String[] args) throws URISyntaxException {
        // Nếu có tham số và tham số đầu tiên không phải flag --web thì lấy làm path
        if (args.length > 0 && !args[0].startsWith("--")) {
            return args[0];
        }
        URL url = Objects.requireNonNull(
                App.class.getClassLoader().getResource("district1_map_v2.csv"), "district1_map_v2.csv");
        return Paths.get(url.toURI()).toString();
    }
}
