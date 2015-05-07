import java.io.UnsupportedEncodingException;

import javax.mail.internet.InternetAddress;


public class InternetAddressTest {

	public static void main(String[] args) throws UnsupportedEncodingException {

		System.out.println(new InternetAddress("tewt@wer.dsf", "홍홍"));
		System.out.println(new InternetAddress("tewt@wer.dsf", "홍홍").getPersonal());
	}

}
