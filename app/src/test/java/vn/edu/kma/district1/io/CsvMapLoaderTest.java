package vn.edu.kma.district1.io;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;

class CsvMapLoaderTest {

    @Test
    void loadValidCsvBuildsExpectedNodes(@TempDir Path dir) throws Exception {
        Path file = dir.resolve("ok.csv");
        Files.writeString(
                file,
                """
                from_id,to_id,from_name,to_name,distance_m,speed_kmh,is_oneway,from_lat,from_lng,to_lat,to_lng
                A,B,Alpha,Beta,100,30,false,10.0,106.0,10.1,106.1
                B,C,Beta,Gamma,200,40,false,10.1,106.1,10.2,106.2
                """);
        Graph graph = CsvMapLoader.load(file.toString());
        assertEquals(3, graph.getAllNodeIds().size());
        assertEquals(10.0, graph.getNode("A").getLatitude());
    }

    @Test
    void missingFileThrowsAppExceptionWithPath() {
        AppException ex = assertThrows(AppException.class, () -> CsvMapLoader.load("/no/such/file.csv"));
        assertTrue(ex.getMessage().contains("Không tìm thấy file"));
    }

    @Test
    void emptyDataSectionLeavesGraphWithoutEdges(@TempDir Path dir) throws Exception {
        Path file = dir.resolve("empty.csv");
        Files.writeString(
                file,
                """
                from_id,to_id,from_name,to_name,distance_m,speed_kmh,is_oneway,from_lat,from_lng,to_lat,to_lng
                """);
        Graph graph = CsvMapLoader.load(file.toString());
        assertEquals(0, graph.getNodeCount());
    }

    @Test
    void shortLineIsSkipped(@TempDir Path dir) throws Exception {
        Path file = dir.resolve("short.csv");
        Files.writeString(
                file,
                """
                from_id,to_id,from_name,to_name,distance_m,speed_kmh,is_oneway,from_lat,from_lng,to_lat,to_lng
                A,B
                X,Y,Xloc,Yloc,50,20,false,10.0,106.0,10.1,106.1
                """);
        Graph graph = CsvMapLoader.load(file.toString());
        assertEquals(2, graph.getAllNodeIds().size());
    }

    @Test
    void negativeDistanceRowIsIgnored(@TempDir Path dir) throws Exception {
        Path file = dir.resolve("badvalue.csv");
        Files.writeString(
                file,
                """
                from_id,to_id,from_name,to_name,distance_m,speed_kmh,is_oneway,from_lat,from_lng,to_lat,to_lng
                A,B,a,b,-100,30,false,10.0,106.0,10.1,106.1
                A,C,a,c,120,30,false,10.0,106.0,10.2,106.2
                """);
        Graph graph = CsvMapLoader.load(file.toString());
        assertEquals(2, graph.getAllNodeIds().size());
        assertEquals(1, graph.getAdjacentEdges("A").size());
    }
}
