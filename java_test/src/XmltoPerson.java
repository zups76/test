/**
 * Rest.java
 * 2015. 5. 15.
 */

import java.io.IOException;
import java.io.StringReader;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;

import org.xml.sax.InputSource;

public class XmltoPerson {

	/**
	 * @param args
	 * @throws IOException
	 * @throws ClientProtocolException
	 */
	public static void main(String[] args) throws Exception {

		String sss = "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>"
				+ "<person>"
				+ "<family>"
				+ "      <persons/>"
				+ "    <description>Family Mimul</description>"
				+ "</family>"
				+ "<firstName>LeeDong</firstName>"
				+ "<lastName>Hong</lastName>" + "</person>";

		try {
			JAXBContext context = JAXBContext.newInstance(Person.class);
			Unmarshaller un = context.createUnmarshaller();
			Person emp = (Person) un.unmarshal(new InputSource(new StringReader(sss)));
			System.out.println(emp.getFirstName());
		} catch (JAXBException e) {
			e.printStackTrace();
		}

	}
}
