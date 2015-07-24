import javax.net.ssl.SSLContext;

import org.apache.http.client.HttpClient;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContextBuilder;
import org.apache.http.conn.ssl.TrustSelfSignedStrategy;
import org.apache.http.impl.client.HttpClientBuilder;
import org.springframework.beans.factory.FactoryBean;

/**
 * TrustSelfSignedCertHttpClientFactory.java
 * 2015. 6. 8.
 */

/**
 * Cloud Mesh : 
 * @since 2015. 6. 8.
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *   
 *   수정일      수정자           수정내용
 *  -------       --------    ---------------------------
 *
 * </pre>
 */
public class TrustSelfSignedCertHttpClientFactory implements FactoryBean<HttpClient> {

	@Override
	public HttpClient getObject() throws Exception {
	    SSLContext sslContext =
	      new SSLContextBuilder()
	        .loadTrustMaterial(null, new TrustSelfSignedStrategy())
	        .build();

	    SSLConnectionSocketFactory sslConnectionSocketFactory
	      = new SSLConnectionSocketFactory(sslContext);

	    return HttpClientBuilder.create()
	      .useSystemProperties()
	      .setSSLSocketFactory(sslConnectionSocketFactory)  // add custom config
	      .build();
	}
	
	@Override
	public Class<?> getObjectType() {
		// TODO Auto-generated method stub
		return HttpClient.class;
	}

	@Override
	public boolean isSingleton() {
		// TODO Auto-generated method stub
		return true;
	}
}
