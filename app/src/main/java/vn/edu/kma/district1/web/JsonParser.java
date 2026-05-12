package vn.edu.kma.district1.web;

import java.util.ArrayList;
import java.util.List;

public class JsonParser {

    public static String getString(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start == -1) return null;
        start += pattern.length();
        int end = json.indexOf("\"", start);
        if (end == -1) return null;
        return json.substring(start, end);
    }

    public static List<String> getStringArray(String json, String key) {
        String pattern = "\"" + key + "\":[";
        int start = json.indexOf(pattern);
        if (start == -1) return List.of();
        start += pattern.length();
        int end = json.indexOf("]", start);
        if (end == -1) return List.of();
        
        String content = json.substring(start, end).trim();
        if (content.isEmpty()) return List.of();
        
        String[] parts = content.split(",");
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            String s = part.trim();
            if (s.startsWith("\"") && s.endsWith("\"")) {
                s = s.substring(1, s.length() - 1);
            }
            result.add(s);
        }
        return result;
    }
}
