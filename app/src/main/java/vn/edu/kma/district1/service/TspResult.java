package vn.edu.kma.district1.service;

import java.util.List;

/**
 * Lộ trình TSP tối ưu (danh sách đỉnh theo thứ tự thăm) và tổng chi phí.
 */
public record TspResult(List<String> visitOrder, double totalCost) {}
