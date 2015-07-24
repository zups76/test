import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;

import org.springframework.http.HttpMethod;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.RequestCallback;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.web.client.RestTemplate;
import org.xml.sax.InputSource;

public class XmltoVo {

	public static void main(String[] args) throws Exception {

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
				try {
					JAXBContext context = JAXBContext.newInstance(Vms.class);
					Unmarshaller un = context.createUnmarshaller();
					Vms emp = (Vms) un.unmarshal(new InputSource(new StringReader(sss.trim())));

					System.out.println(emp.getVm().get(0).getName());
					System.out.println(emp.getVm().get(0).getCpu_usage());
					System.out.println(emp.getVm().get(0).getDisk_usage());
					System.out.println(emp.getVm().get(0).getMem_usage());
				} catch (JAXBException e) {
					e.printStackTrace();
				}
				return response;
			}
		};

		RequestCallback callback = new RequestCallback() {
			@Override
			public void doWithRequest(ClientHttpRequest request) throws IOException {
				// request.getHeaders().add("Authorization", "admin:cson");
			}
		};

		RestTemplate d = new RestTemplate();
		d.execute(
				"https://cloud.smplatform.go.kr/cloudmesh/dashBoardController.do?acton=dashBoardXml",
				HttpMethod.GET, callback, extractor1);
	}
}
