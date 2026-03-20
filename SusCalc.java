import java.util.Scanner;

public class SusCalc {

    // Rough emission factors
    private static final double CO2_PER_SHOWER_MINUTE = 0.10;
    private static final double CO2_PER_RED_MEAT_MEAL = 7.0;
    private static final double CO2_PER_CAR_MILE = 0.404;
    private static final double CO2_PER_FLIGHT = 250.0;
    private static final double CO2_PER_FAST_FASHION_ITEM = 8.0;

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.println("=== Sustainability Habit Calculator ===");

        double showerMinutesPerDay = readDoubleInRange(
                scanner,
                "Average shower minutes per day: ",
                0,
                120
        );

        int redMeatMealsPerWeek = readIntInRange(
                scanner,
                "Red meat meals per week: ",
                0,
                50
        );

        double carMilesPerWeek = readDoubleInRange(
                scanner,
                "Car miles driven per week: ",
                0,
                5000
        );

        int flightsPerYear = readIntInRange(
                scanner,
                "Flights per year: ",
                0,
                100
        );

        int fashionItemsPerMonth = readIntInRange(
                scanner,
                "Fast fashion items bought per month: ",
                0,
                100
        );

        HabitImpact impact = calculateImpact(
                showerMinutesPerDay,
                redMeatMealsPerWeek,
                carMilesPerWeek,
                flightsPerYear,
                fashionItemsPerMonth
        );

        printReport(impact);

        scanner.close();
    }

    public static HabitImpact calculateImpact(double showerMinutesPerDay,
                                              int redMeatMealsPerWeek,
                                              double carMilesPerWeek,
                                              int flightsPerYear,
                                              int fashionItemsPerMonth) {

        double showerCO2 = showerMinutesPerDay * 365 * CO2_PER_SHOWER_MINUTE;
        double meatCO2 = redMeatMealsPerWeek * 52 * CO2_PER_RED_MEAT_MEAL;
        double carCO2 = carMilesPerWeek * 52 * CO2_PER_CAR_MILE;
        double flightCO2 = flightsPerYear * CO2_PER_FLIGHT;
        double fashionCO2 = fashionItemsPerMonth * 12 * CO2_PER_FAST_FASHION_ITEM;

        double totalCO2 = showerCO2 + meatCO2 + carCO2 + flightCO2 + fashionCO2;

        String biggestCategory = "Showers";
        double biggestValue = showerCO2;

        if (meatCO2 > biggestValue) {
            biggestValue = meatCO2;
            biggestCategory = "Red Meat";
        }

        if (carCO2 > biggestValue) {
            biggestValue = carCO2;
            biggestCategory = "Car Travel";
        }

        if (flightCO2 > biggestValue) {
            biggestValue = flightCO2;
            biggestCategory = "Flights";
        }

        if (fashionCO2 > biggestValue) {
            biggestValue = fashionCO2;
            biggestCategory = "Fast Fashion";
        }

        String recommendation = buildRecommendation(biggestCategory);

        return new HabitImpact(
                showerCO2,
                meatCO2,
                carCO2,
                flightCO2,
                fashionCO2,
                totalCO2,
                biggestCategory,
                recommendation
        );
    }

    private static String buildRecommendation(String biggestCategory) {
        switch (biggestCategory) {
            case "Showers":
                return "Try reducing shower time by 2-3 minutes per day to lower water-heating emissions.";
            case "Red Meat":
                return "Try replacing 1-2 red meat meals per week with chicken, beans, or plant-based meals.";
            case "Car Travel":
                return "Try carpooling, public transit, or combining trips to cut driving emissions.";
            case "Flights":
                return "Reducing even one flight per year can significantly lower your footprint.";
            case "Fast Fashion":
                return "Buy fewer new clothes, thrift more often, and choose longer-lasting items.";
            default:
                return "Keep improving one habit at a time.";
        }
    }

    private static void printReport(HabitImpact impact) {
        System.out.println();
        System.out.println("=== Annual CO2 Impact Report ===");
        System.out.printf("Showers:      %.2f kg CO2/year%n", impact.getShowerCO2());
        System.out.printf("Red Meat:     %.2f kg CO2/year%n", impact.getMeatCO2());
        System.out.printf("Car Travel:   %.2f kg CO2/year%n", impact.getCarCO2());
        System.out.printf("Flights:      %.2f kg CO2/year%n", impact.getFlightCO2());
        System.out.printf("Fast Fashion: %.2f kg CO2/year%n", impact.getFashionCO2());
        System.out.println("--------------------------------");
        System.out.printf("TOTAL:        %.2f kg CO2/year%n", impact.getTotalCO2());
        System.out.printf("TOTAL:        %.2f tons CO2/year%n", impact.getTotalCO2() / 1000.0);

        System.out.println();
        System.out.println("Biggest impact area: " + impact.getBiggestCategory());
        System.out.println("Best suggestion: " + impact.getRecommendation());
    }

    private static int readIntInRange(Scanner scanner, String prompt, int min, int max) {
        while (true) {
            System.out.print(prompt);
            String input = scanner.nextLine().trim();

            try {
                int value = Integer.parseInt(input);

                if (value < min || value > max) {
                    System.out.println("Please enter a whole number between " + min + " and " + max + ".");
                    continue;
                }

                return value;
            } catch (NumberFormatException e) {
                System.out.println("Invalid input. Please enter a whole number.");
            }
        }
    }

    private static double readDoubleInRange(Scanner scanner, String prompt, double min, double max) {
        while (true) {
            System.out.print(prompt);
            String input = scanner.nextLine().trim();

            try {
                double value = Double.parseDouble(input);

                if (value < min || value > max) {
                    System.out.println("Please enter a number between " + min + " and " + max + ".");
                    continue;
                }

                return value;
            } catch (NumberFormatException e) {
                System.out.println("Invalid input. Please enter a valid number.");
            }
        }
    }
}

class HabitImpact {
    private final double showerCO2;
    private final double meatCO2;
    private final double carCO2;
    private final double flightCO2;
    private final double fashionCO2;
    private final double totalCO2;
    private final String biggestCategory;
    private final String recommendation;

    public HabitImpact(double showerCO2,
                       double meatCO2,
                       double carCO2,
                       double flightCO2,
                       double fashionCO2,
                       double totalCO2,
                       String biggestCategory,
                       String recommendation) {
        this.showerCO2 = showerCO2;
        this.meatCO2 = meatCO2;
        this.carCO2 = carCO2;
        this.flightCO2 = flightCO2;
        this.fashionCO2 = fashionCO2;
        this.totalCO2 = totalCO2;
        this.biggestCategory = biggestCategory;
        this.recommendation = recommendation;
    }

    public double getShowerCO2() {
        return showerCO2;
    }

    public double getMeatCO2() {
        return meatCO2;
    }

    public double getCarCO2() {
        return carCO2;
    }

    public double getFlightCO2() {
        return flightCO2;
    }

    public double getFashionCO2() {
        return fashionCO2;
    }

    public double getTotalCO2() {
        return totalCO2;
    }

    public String getBiggestCategory() {
        return biggestCategory;
    }

    public String getRecommendation() {
        return recommendation;
    }
}