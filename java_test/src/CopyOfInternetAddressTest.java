import java.net.InetAddress;
import java.net.UnknownHostException;


public class CopyOfInternetAddressTest {

	public static void main(String[] args) throws UnknownHostException {

		// 255 255 255 255
		// 11111111 11111111 11111111 11111111
		//                         1024 512 256  128 64 32 16 8 4 2 1
		long start = ipToLong(InetAddress.getByName("192.168.1.0"));
		long end = ipToLong(InetAddress.getByName("192.170.1.0"));; 
		
		
		String[] a = "192.168.1.0".split(".");
		String[] b = "192.170.3.0".split(".");

		System.out.println(start);
		System.out.println(end);
		System.out.println(end-start);
	}

	private static long ipToLong(InetAddress ip) { 
		byte[] octets = ip.getAddress();
		long result = 0;
		for (byte octet : octets) {
			result <<= 8;
			result |= octet & 0xff;
		}
		return result; 
	}
}
