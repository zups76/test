import java.util.ArrayList;
import java.util.List;



public class StringText {

	public static void main(String[] args) {

		System.out.println("aaaaa.txt".substring("aaaaa.txt".lastIndexOf('.')+1));
		
		// 숫자와 마침표를 제외하고 모두 제거
		System.out.println("123:3!@:3!@#12;3aSf;sD.FAaa1 12".replaceAll("([^0-9.])", ""));
		
		
		String dns_server = "[11,111,22,222,33,333,44]";
		

		List<String> data = new ArrayList<String>();

		try{
			String[] tmp = dns_server.replaceAll("([\\[\\]])", "").split(",");

			for (int i = 0; i < tmp.length; i++) {
				if(i%2 == 0)
					data.add(tmp[i]);
				else
					data.set(data.size()-1, data.get(data.size()-1) + "," + tmp[i]);
			}
		}catch(Exception e){
		}
		System.out.println(data);
		

		System.out.println("-------------------");
		
		
		
		
		
		
		
		
		
		String txt = "[11,111,22,222,33,333]";
		txt = txt.replaceAll("([\\[\\]])", "");
		
		System.out.println(txt);
		System.out.println(txt);
		
		System.out.println(txt.split("([0-9][,][0-9])").length);

	
	
	
	
		String aaa = "{ipAddress=192.168.1.1, subnetId=2b6ca715-974a-4252-a748-3ff092f3905a}]";

		System.out.println(aaa.split(",")[0].split("=")[1]);
		System.out.println(aaa.split(",")[1].split("=")[1].replaceAll("([^a-z0-9\\-])", ""));

		System.out.println(aaa.split(",")[1].split("=")[1].replaceAll("([^a-z0-9\\-])", ""));
		
		if(aaa.indexOf("{") > -1)
			aaa = aaa.substring(aaa.indexOf("{")+1);
		if(aaa.indexOf("{") > -1)
			aaa = aaa.substring(aaa.indexOf("{")+1);
		System.out.println(aaa);

		System.out.println(aaa.replaceAll("(\\[IP\\{ipAddress=)|(subnetId=)|(}\\])", ""));
	
	
	
	
	
	
	}

	private static String sdf(String s){

		int s_len = s.length();
		int idx = s.indexOf("[msg:");
		if(idx > -1)
		{
			int i=idx+5;
			for(;i<s_len;i++)
			{
				if(s.charAt(i) == ']')
					break;
			}
			System.out.println(i);
			System.out.println(i-idx+5);
			String ss = s.substring(idx, i+1);

			System.out.println(ss);
			System.out.println(s.substring(idx+5,i));
			//System.out.println(s.replace(ss, getMessage(s.substring(idx+5,i))));
			return null;
		}
		else
			return s;
	}
}
