import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.Certificate;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLPeerUnverifiedException;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

public class HttpsTest {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		String https_url = "https://mdm.sbc.or.kr/httpService/user.do?service=userService&command=deleteUser&USER_ID=test";
		// String https_url = "https://localhost:8443/web";
		// https://mportal.sbc.or.kr/
		URL url;
		try {

			TrustManager[] trustAllCerts = new TrustManager[] { new X509TrustManager() {

				public java.security.cert.X509Certificate[] getAcceptedIssuers() {
					return null;
				}

				public void checkServerTrusted(
						java.security.cert.X509Certificate[] certs,
						String authType) {
				}

				public void checkClientTrusted(
						java.security.cert.X509Certificate[] certs,
						String authType) {
				}

			} };

			try {
				SSLContext sc = SSLContext.getInstance("SSL");
				sc.init(null, trustAllCerts, new java.security.SecureRandom());
				HttpsURLConnection.setDefaultSSLSocketFactory(sc
						.getSocketFactory());
//			} catch (KeyManagementException | NoSuchAlgorithmException e) {
			} catch (Exception e) {
				e.printStackTrace();
			}

			url = new URL(https_url);
			HttpsURLConnection con = (HttpsURLConnection) url.openConnection();

			if (con != null) {

				try {

					System.out.println("Response Code : "
							+ con.getResponseCode());
					System.out
							.println("Cipher Suite : " + con.getCipherSuite());
					System.out.println("\n");

					Certificate[] certs = con.getServerCertificates();
					for (Certificate cert : certs) {
						System.out.println("Cert Type : " + cert.getType());
						System.out.println("Cert Hash Code : "
								+ cert.hashCode());
						System.out.println("Cert Public Key Algorithm : "
								+ cert.getPublicKey().getAlgorithm());
						System.out.println("Cert Public Key Format : "
								+ cert.getPublicKey().getFormat());
						System.out.println("\n");
					}

				} catch (SSLPeerUnverifiedException e) {
					e.printStackTrace();
				} catch (IOException e) {
					e.printStackTrace();
				}

			}
			if (con != null) {

				try {

					System.out.println("****** Content of the URL ********");
					BufferedReader br = new BufferedReader(
							new InputStreamReader(con.getInputStream()));

					String input;

					while ((input = br.readLine()) != null) {
						System.out.println(input);
					}
					br.close();

				} catch (IOException e) {
					e.printStackTrace();
				}

			}

		} catch (MalformedURLException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

}
