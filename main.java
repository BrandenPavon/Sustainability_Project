import java.io.IOException;

class Main {

  public static void main(String[] args) {
    myhttpserver myserver = new myhttpserver();
    try {
      myserver.acceptLoop();
    } catch (IOException e) {
      e.printStackTrace(); // Handle the error here
    }
  }

}
