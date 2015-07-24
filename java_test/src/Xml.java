/**
 * Rest.java
 * 2015. 5. 15.
 */


import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.springframework.http.HttpMethod;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.RequestCallback;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

public class Xml {

	private static void template(boolean parse) {

		RequestCallback callback = new RequestCallback() {
			@Override
			public void doWithRequest(ClientHttpRequest request) throws IOException {
				request.getHeaders().add("Authorization", "admin:cson");
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
				
				
				
				XPath xpath = XPathFactory.newInstance().newXPath();

				InputSource is = new InputSource(new StringReader(sss.trim()));
//				InputSource is = new InputSource(new StringReader(sss.substring(sss.indexOf('>')+1)));
//				InputSource is = response.getBody();
				
				Document document;
				try {
					document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(is);
					// NodeList 가져오기 : row 아래에 있는 모든 col1 을 선택
					NodeList cols = (NodeList)xpath.evaluate("//vms/vm/name", document, XPathConstants.NODESET);
//					NodeList cols = (NodeList)xpath.evaluate("//vms/vm/name", document, XPathConstants.NODESET);
					for( int idx=0; idx<cols.getLength(); idx++ ){
						System.out.print(cols.item(idx).getTextContent());
					}
				} catch (Exception e) {
					e.printStackTrace();
				}

//
//
//<?xml version="1.0" encoding="UTF-8"?>
//<vms>
//  <vm>
//    <name>ALL</name>
//    <cpu_usage>3%</cpu_usage>
//    <mem_usage>1%</mem_usage>
//    <disk_usage>62%</disk_usage>
//  </vm>
//</vms>
//
//
//

				return response;
			}
		};

		RestTemplate d = new RestTemplate();
		d.execute("https://cloud.smplatform.go.kr/cloudmesh/dashBoardController.do?acton=dashBoardXml", HttpMethod.GET, callback, extractor1);
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
