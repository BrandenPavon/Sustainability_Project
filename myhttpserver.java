import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;

class myhttpserver {
  public HttpServer setup() throws IOException {
    HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
    server.createContext("/test", (exchange) -> {
        String response = "Hello from Java 8!";
        exchange.sendResponseHeaders(200, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    });
    server.setExecutor(null); // Default executor
    return server;
  }
  public void acceptLoop() throws IOException {
    HttpServer myserver = setup();
    myserver.start();

  }
}
