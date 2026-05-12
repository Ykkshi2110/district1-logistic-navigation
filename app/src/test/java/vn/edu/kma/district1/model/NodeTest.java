package vn.edu.kma.district1.model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class NodeTest {

    @Test
    void addEdgesIncreasesAdjacencySize() {
        Node node = new Node("A", "Alpha");
        node.addEdge(new Edge("B", 10, 30, false));
        node.addEdge(new Edge("C", 20, 30, false));
        assertEquals(2, node.getEdges().size());
    }
}
