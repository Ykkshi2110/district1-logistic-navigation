package vn.edu.kma.district1.service;

import java.util.List;

/**
 * Lộ trình TSP tối ưu (danh sách đỉnh theo thứ tự thăm), tổng chi phí và các bước thực thi.
 */
public record TspResult(List<String> visitOrder, double totalCost, List<String> executionSteps) {}
