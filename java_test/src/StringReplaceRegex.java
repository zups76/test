

public class StringReplaceRegex {

	public static void main(String[] args) {

		System.out.println("aaaaa{aaa}aa{abc}aaaa".replaceAll("([{][a]{3}[}])|([{][a][b][c][}])", "---"));
		System.out.println("aaaaa{aaa}aa{abc}aaaa".replaceAll("([{][a]{3}[}])|([{]abc[}])", "---"));
		System.out.println("aaaaa{aaa}aa{abc}aaaa".replaceAll("[{][a]{3}[}]", "---"));
		System.out.println("aaaaa{aaa}aa{abc}aaaa".replaceAll("[{]aaa[}]", "---"));
		System.out.println("aaaaa{aaa}aa{abc}aaaa".replaceAll("\\{aaa\\}", "---"));
	}
}
