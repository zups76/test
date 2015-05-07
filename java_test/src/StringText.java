

public class StringText {

	public static void main(String[] args) {

		System.out.println("msg:123".substring("msg:".length()));
		
		System.out.println("[msg:".substring("[msg".length()));
		//sdf("<tgfgfgfgh>[msg:title.casdsdasdluster]</th>");
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
