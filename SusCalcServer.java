import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class SusCalcServer {

    private static final double CO2_PER_SHOWER_MINUTE      = 0.10;
    private static final double CO2_PER_RED_MEAT_MEAL      = 6.9;
    private static final double CO2_PER_CAR_MILE           = 0.404;
    private static final double CO2_PER_FLIGHT             = 190.0;
    private static final double CO2_PER_FAST_FASHION_ITEM  = 8.0;
    private static final double CO2_PER_DOLLAR_ELECTRICITY = 2.27;
    private static final double CO2_PER_GALLON_WATER       = 0.10;
    private static final double CO2_PER_DOLLAR_SHOPPING    = 0.231;
    private static final double CO2_PER_AI_SEARCH          = 0.00114;

    private static final String INDEX_FILE = "templates/suscalc_index.html";
    private static final String STYLE_FILE = "static/styles.css";
    private static final String JS_FILE    = "static/app.js";

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8071), 0);
        server.createContext("/", new IndexHandler(INDEX_FILE));
        server.createContext("/styles.css", new IndexHandler(STYLE_FILE));
        server.createContext("/app.js", new IndexHandler(JS_FILE));
        server.createContext("/calculate", new CalculateHandler());
        server.setExecutor(null);
        server.start();
        System.out.println("SusCalc backend running at http://localhost:8071");
    }

    private static String getMimeType(Path path) {
        String name = path.getFileName().toString();
        if (name.endsWith(".css")) return "text/css; charset=UTF-8";
        if (name.endsWith(".js"))  return "application/javascript; charset=UTF-8";
        return "text/html; charset=UTF-8";
    }

    // -------------------------------------------------------------------------
    // GET / — serves static files
    // -------------------------------------------------------------------------
    static class IndexHandler implements HttpHandler {
        private final Path filePath;

        IndexHandler(String filePath) {
            this.filePath = Paths.get(filePath);
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "text/plain", "Only GET is allowed on this endpoint.");
                return;
            }
            if (!Files.exists(filePath)) {
                sendResponse(exchange, 404, "text/plain", filePath + " not found.");
                return;
            }
            try {
                byte[] bytes = Files.readAllBytes(filePath);
                exchange.getResponseHeaders().set("Content-Type", getMimeType(filePath));
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } catch (IOException e) {
                sendResponse(exchange, 500, "text/plain", "Error reading " + filePath);
            }
        }
    }

    // -------------------------------------------------------------------------
    // POST /calculate — computes CO2 impact and returns JSON
    // -------------------------------------------------------------------------
    static class CalculateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Only POST is allowed.\"}");
                return;
            }

            try {
                String body = readBody(exchange.getRequestBody());

                double showerMinutesPerDay    = extractDouble(body, "showerMinutesPerDay");
                int    redMeatMealsPerWeek    = extractInt   (body, "redMeatMealsPerWeek");
                double carMilesPerWeek        = extractDouble(body, "carMilesPerWeek");
                int    flightsPerYear         = extractInt   (body, "flightsPerYear");
                int    fashionItemsPerMonth   = extractInt   (body, "fashionItemsPerMonth");
                double monthlyElectricityBill = extractDouble(body, "monthlyElectricityBill");
                double monthlyWaterBill       = extractDouble(body, "monthlyWaterBill");
                double monthlyShoppingSpend   = extractDouble(body, "monthlyShoppingSpend");
                int    aiSearchesPerDay       = extractInt   (body, "aiSearchesPerDay");

                String validationError = validateInputs(
                        showerMinutesPerDay, redMeatMealsPerWeek,
                        carMilesPerWeek, flightsPerYear, fashionItemsPerMonth,
                        monthlyElectricityBill, monthlyWaterBill,
                        monthlyShoppingSpend, aiSearchesPerDay);

                if (validationError != null) {
                    sendJson(exchange, 400, "{\"error\":\"" + escapeJson(validationError) + "\"}");
                    return;
                }

                HabitImpact impact = calculateImpact(
                        showerMinutesPerDay, redMeatMealsPerWeek,
                        carMilesPerWeek, flightsPerYear, fashionItemsPerMonth,
                        monthlyElectricityBill, monthlyWaterBill,
                        monthlyShoppingSpend, aiSearchesPerDay);

                String json = "{"
                        + "\"showerCO2\":"        + impact.getShowerCO2()        + ","
                        + "\"meatCO2\":"          + impact.getMeatCO2()          + ","
                        + "\"carCO2\":"           + impact.getCarCO2()           + ","
                        + "\"flightCO2\":"        + impact.getFlightCO2()        + ","
                        + "\"fashionCO2\":"       + impact.getFashionCO2()       + ","
                        + "\"electricityCO2\":"   + impact.getElectricityCO2()   + ","
                        + "\"waterCO2\":"         + impact.getWaterCO2()         + ","
                        + "\"shoppingCO2\":"      + impact.getShoppingCO2()      + ","
                        + "\"aiCO2\":"            + impact.getAiCO2()            + ","
                        + "\"totalCO2\":"         + impact.getTotalCO2()         + ","
                        + "\"biggestCategory\":\"" + escapeJson(impact.getBiggestCategory()) + "\","
                        + "\"recommendation\":\""  + escapeJson(impact.getRecommendation())  + "\""
                        + "}";

                sendJson(exchange, 200, json);

            } catch (IllegalArgumentException e) {
                sendJson(exchange, 400, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            } catch (Exception e) {
                sendJson(exchange, 500, "{\"error\":\"Server error while calculating impact.\"}");
            }
        }
    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------
    private static HabitImpact calculateImpact(double showerMinutesPerDay,
                                               int    redMeatMealsPerWeek,
                                               double carMilesPerWeek,
                                               int    flightsPerYear,
                                               int    fashionItemsPerMonth,
                                               double monthlyElectricityBill,
                                               double monthlyWaterBill,
                                               double monthlyShoppingSpend,
                                               int    aiSearchesPerDay) {

        double showerCO2      = showerMinutesPerDay    * 365 * CO2_PER_SHOWER_MINUTE;
        double meatCO2        = redMeatMealsPerWeek    *  52 * CO2_PER_RED_MEAT_MEAL;
        double carCO2         = carMilesPerWeek        *  52 * CO2_PER_CAR_MILE;
        double flightCO2      = flightsPerYear              * CO2_PER_FLIGHT;
        double fashionCO2     = fashionItemsPerMonth   *  12 * CO2_PER_FAST_FASHION_ITEM;
        double electricityCO2 = monthlyElectricityBill *  12 * CO2_PER_DOLLAR_ELECTRICITY;
        double waterCO2       = monthlyWaterBill        *  12 * CO2_PER_GALLON_WATER;
        double shoppingCO2    = monthlyShoppingSpend    *  12 * CO2_PER_DOLLAR_SHOPPING;
        double aiCO2          = aiSearchesPerDay        * 365 * CO2_PER_AI_SEARCH;

        double totalCO2 = showerCO2 + meatCO2 + carCO2 + flightCO2 + fashionCO2
                        + electricityCO2 + waterCO2 + shoppingCO2 + aiCO2;

        String biggestCategory = "Showers";
        double biggestValue    = showerCO2;
        if (meatCO2        > biggestValue) { biggestValue = meatCO2;        biggestCategory = "Red Meat";     }
        if (carCO2         > biggestValue) { biggestValue = carCO2;         biggestCategory = "Car Travel";   }
        if (flightCO2      > biggestValue) { biggestValue = flightCO2;      biggestCategory = "Flights";      }
        if (fashionCO2     > biggestValue) { biggestValue = fashionCO2;     biggestCategory = "Fast Fashion"; }
        if (electricityCO2 > biggestValue) { biggestValue = electricityCO2; biggestCategory = "Electricity";  }
        if (waterCO2       > biggestValue) { biggestValue = waterCO2;       biggestCategory = "Water";        }
        if (shoppingCO2    > biggestValue) { biggestValue = shoppingCO2;    biggestCategory = "Shopping";     }
        if (aiCO2          > biggestValue) {                                 biggestCategory = "AI Searches";  }

        return new HabitImpact(showerCO2, meatCO2, carCO2, flightCO2, fashionCO2,
                               electricityCO2, waterCO2, shoppingCO2, aiCO2,
                               totalCO2, biggestCategory, buildRecommendation(biggestCategory));
    }

    private static String buildRecommendation(String biggestCategory) {
        switch (biggestCategory) {
            case "Showers":      return "Try reducing shower time by 2-3 minutes per day to lower water-heating emissions.";
            case "Red Meat":     return "Try replacing 1-2 red meat meals per week with chicken, beans, or plant-based meals.";
            case "Car Travel":   return "Try carpooling, public transit, or combining trips to cut driving emissions.";
            case "Flights":      return "Reducing even one flight per year can significantly lower your footprint.";
            case "Fast Fashion": return "Buy fewer new clothes, thrift more often, and choose longer-lasting items.";
            case "Electricity":  return "Switch to LED bulbs, unplug idle devices, and consider a renewable energy plan.";
            case "Water":        return "Fix leaks, install low-flow fixtures, and shorten outdoor watering cycles.";
            case "Shopping":     return "Buy secondhand, repair instead of replace, and avoid impulse purchases.";
            case "AI Searches":  return "Batch your AI queries, use lighter models when possible, and prefer cached results.";
            default:             return "Keep improving one habit at a time.";
        }
    }

    private static String validateInputs(double showerMinutesPerDay,
                                         int    redMeatMealsPerWeek,
                                         double carMilesPerWeek,
                                         int    flightsPerYear,
                                         int    fashionItemsPerMonth,
                                         double monthlyElectricityBill,
                                         double monthlyWaterBill,
                                         double monthlyShoppingSpend,
                                         int    aiSearchesPerDay) {
        if (showerMinutesPerDay    < 0 || showerMinutesPerDay    > 120)   return "Shower minutes must be 0–120.";
        if (redMeatMealsPerWeek    < 0 || redMeatMealsPerWeek    >  50)   return "Red meat meals must be 0–50.";
        if (carMilesPerWeek        < 0 || carMilesPerWeek        > 5000)  return "Car miles must be 0–5000.";
        if (flightsPerYear         < 0 || flightsPerYear         >  100)  return "Flights must be 0–100.";
        if (fashionItemsPerMonth   < 0 || fashionItemsPerMonth   >  100)  return "Fashion items must be 0–100.";
        if (monthlyElectricityBill < 0 || monthlyElectricityBill > 10000) return "Electricity bill must be 0–10,000.";
        if (monthlyWaterBill       < 0 || monthlyWaterBill       > 10000) return "Water bill must be 0–10,000.";
        if (monthlyShoppingSpend   < 0 || monthlyShoppingSpend   > 50000) return "Shopping spend must be 0–50,000.";
        if (aiSearchesPerDay       < 0 || aiSearchesPerDay       > 10000) return "AI searches must be 0–10,000.";
        return null;
    }

    // -------------------------------------------------------------------------
    // Shared HTTP helpers
    // -------------------------------------------------------------------------
    private static void addCorsHeaders(HttpExchange exchange) {
        Headers headers = exchange.getResponseHeaders();
        headers.add("Access-Control-Allow-Origin",  "*");
        headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        headers.add("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        sendResponse(exchange, status, "application/json", json);
    }

    private static void sendResponse(HttpExchange exchange, int status,
                                     String contentType, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType + "; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readBody(InputStream inputStream) throws IOException {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) sb.append(line);
        return sb.toString();
    }

    private static double extractDouble(String json, String key) {
        try { return Double.parseDouble(extractValue(json, key)); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("Invalid number for " + key + "."); }
    }

    private static int extractInt(String json, String key) {
        try { return Integer.parseInt(extractValue(json, key)); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("Invalid whole number for " + key + "."); }
    }

    private static String extractValue(String json, String key) {
        String quotedKey = "\"" + key + "\"";
        int keyIndex = json.indexOf(quotedKey);
        if (keyIndex == -1) throw new IllegalArgumentException("Missing field: " + key + ".");

        int colonIndex = json.indexOf(":", keyIndex);
        if (colonIndex == -1) throw new IllegalArgumentException("Invalid JSON for field: " + key + ".");

        int start = colonIndex + 1;
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) start++;

        int end = start;
        while (end < json.length() && ",}".indexOf(json.charAt(end)) == -1) end++;

        return json.substring(start, end).trim().replace("\"", "");
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
