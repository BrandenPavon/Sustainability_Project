class HabitImpact {
    private final double showerCO2, meatCO2, carCO2, flightCO2, fashionCO2;
    private final double electricityCO2, waterCO2, shoppingCO2, aiCO2, totalCO2;
    private final String biggestCategory, recommendation;

    public HabitImpact(double showerCO2, double meatCO2, double carCO2,
                       double flightCO2, double fashionCO2,
                       double electricityCO2, double waterCO2,
                       double shoppingCO2, double aiCO2,
                       double totalCO2, String biggestCategory, String recommendation) {
        this.showerCO2       = showerCO2;
        this.meatCO2         = meatCO2;
        this.carCO2          = carCO2;
        this.flightCO2       = flightCO2;
        this.fashionCO2      = fashionCO2;
        this.electricityCO2  = electricityCO2;
        this.waterCO2        = waterCO2;
        this.shoppingCO2     = shoppingCO2;
        this.aiCO2           = aiCO2;
        this.totalCO2        = totalCO2;
        this.biggestCategory = biggestCategory;
        this.recommendation  = recommendation;
    }

    public double getShowerCO2()       { return showerCO2;       }
    public double getMeatCO2()         { return meatCO2;         }
    public double getCarCO2()          { return carCO2;          }
    public double getFlightCO2()       { return flightCO2;       }
    public double getFashionCO2()      { return fashionCO2;      }
    public double getElectricityCO2()  { return electricityCO2;  }
    public double getWaterCO2()        { return waterCO2;        }
    public double getShoppingCO2()     { return shoppingCO2;     }
    public double getAiCO2()           { return aiCO2;           }
    public double getTotalCO2()        { return totalCO2;        }
    public String getBiggestCategory() { return biggestCategory; }
    public String getRecommendation()  { return recommendation;  }
}
