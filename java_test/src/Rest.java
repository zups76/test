/**
 * Rest.java
 * 2015. 5. 15.
 */


import java.io.IOException;
import java.io.InputStream;

import org.springframework.http.HttpMethod;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpResponse;
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

public class Rest {

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
				System.out.println(sss);
				
				return response;
			}
		};

		ResponseExtractor<ClientHttpResponse> extractor2 = new ResponseExtractor<ClientHttpResponse>() {
			@Override
			public ClientHttpResponse extractData(ClientHttpResponse response) throws IOException {

				// the SAX way:
				try {
					XMLReader myReader = XMLReaderFactory.createXMLReader();

					myReader.setContentHandler(new ContentHandler() {

						private String tag = "";

						@Override
						public void setDocumentLocator(Locator arg0) {
//							System.out.println("TOP");
						}

						@Override
						public void startDocument() throws SAXException {
//							System.out.println("START");
						}

						@Override
						public void startElement(String arg0, String tag, String arg2, Attributes arg3) throws SAXException {

							if (!this.tag.equals("") && !this.tag.equals(tag))
								System.out.println(">");

							this.tag = tag;

							System.out.print("<" + tag);

							for (int i = 0; i < arg3.getLength(); i++) {
								System.out.print(" " + arg3.getLocalName(i) + "=\"" + arg3.getValue(i) + "\"");
							}
						}

						@Override
						public void endElement(String uri, String localName, String qName) throws SAXException {
							if (this.tag.equals(localName))
								System.out.println("/>");
							else
								System.out.println("</" + localName + ">");
							tag = "";
						}

						@Override
						public void characters(char[] arg0, int arg1, int arg2) throws SAXException {
							System.out.print(">");
							System.out.print(String.valueOf(arg0) .substring(arg1, arg1 + arg2));
							this.tag = "";
						}

						@Override
						public void startPrefixMapping(String arg0, String arg1) throws SAXException {
							// System.out.println(1 + " - " + arg0 + " - " + arg1);
						}

						@Override
						public void skippedEntity(String arg0) throws SAXException {
							// System.out.println(4 + " - " + arg0);
						}

						@Override
						public void processingInstruction(String arg0, String arg1) throws SAXException {
							// System.out.println(6 + " - " + arg0 + " - " + arg1);
						}

						@Override
						public void ignorableWhitespace(char[] arg0, int arg1, int arg2) throws SAXException {
							// System.out.println(7);
						}

						@Override
						public void endPrefixMapping(String arg0) throws SAXException {
							// System.out.println(8 + " - " + arg0);
						}

						@Override
						public void endDocument() throws SAXException {
//							System.out.println("END");
						}
					});

					myReader.parse(new InputSource(response.getBody()));
				} catch (SAXException e) {
					e.printStackTrace();
				}

				return response;
			}
		};

		ResponseExtractor<ClientHttpResponse> extractor = parse ? extractor2 : extractor1;

		RestTemplate d = new RestTemplate();

		// vb-rest-verdeLicense.dtd
		// d.execute("http://106.240.250.74/mc/rest/verdeUser",
		d.execute("http://106.240.250.74/mc/rest/verdeEvent?queryType=server", HttpMethod.GET, callback, extractor);
		// d.execute("http://106.240.250.74/mc/rest/verdeLicense",
		// d.execute("http://106.240.250.74/mc/rest/userSelect/t1",
		
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
