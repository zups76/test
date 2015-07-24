/**
 * Rest.java
 * 2015. 5. 15.
 */


import java.io.IOException;
import java.io.InputStream;
import java.net.URI;

import org.apache.http.client.ClientProtocolException;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RequestCallback;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.web.client.RestTemplate;
import org.xml.sax.Attributes;
import org.xml.sax.ContentHandler;
import org.xml.sax.InputSource;
import org.xml.sax.Locator;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;
import org.xml.sax.helpers.XMLReaderFactory;

public class Rest2 {

	private static void template(boolean parse) throws Exception {

		RequestCallback callback = new RequestCallback() {
			@Override
			public void doWithRequest(ClientHttpRequest request) throws IOException {
				request.getHeaders().add("Authorization", "admin:insoft00");
			}
		};

		ResponseExtractor<ClientHttpResponse> extractor1 = new ResponseExtractor<ClientHttpResponse>() {
			@Override
			public ClientHttpResponse extractData(ClientHttpResponse response) throws IOException {

				String sss = "";

				InputStream inputstream = response.getBody();

				int read = 0;
				byte[] buf = new byte[512];
				while ((read = inputstream.read(buf)) > 0) {
					String text = new String(buf, 0, read);
					sss += text;
				}
				System.out.println(sss);
				
				return response;
			}
		};

		ResponseExtractor<ClientHttpResponse> extractor = extractor1;

		
		HttpComponentsClientHttpRequestFactory aa = new HttpComponentsClientHttpRequestFactory(new TrustSelfSignedCertHttpClientFactory().getObject());
		
		RestTemplate d = new RestTemplate(aa);
		 d.execute("http://123.212.42.46:9696/v2.0/lb/vips",
						 HttpMethod.GET, callback, extractor);
	}

	/**
	 * @param args
	 * @throws IOException
	 * @throws ClientProtocolException
	 */
	public static void main(String[] args) throws Exception {
		template(true);
	}
}
