import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;

public class MethodTest {

	public static void main(String[] args) throws SecurityException, NoSuchFieldException, IllegalArgumentException, IllegalAccessException {

		BaseVo aa = new BaseVo();
		BaseVo bb = new BaseVo();
		bb.setSite_id("5");
		aa.setBase_vo(bb);

		
		String sdfas  = "site_id";
		
		

		try {
			System.out.println(aa.getClass().getMethod("get" + String.valueOf(sdfas.charAt(0)).toUpperCase() + sdfas.substring(1)).invoke(aa));;
		} catch (InvocationTargetException e) {
			e.printStackTrace();
		} catch (NoSuchMethodException e) {
			e.printStackTrace();
		}
		
		
		
		
		
		String f = "base_vo.site_id";
		String[] f2 = f.split("[.]");

		Field field;
		Object value;
		Object aaaaa;

		aaaaa = aa;

		for (int i = 0; i < f2.length; i++) {

			field = aaaaa.getClass().getDeclaredField(f2[i]);
			field.setAccessible(true);

			value = field.get(aaaaa);
			System.out.println(value);

			aaaaa = value;
		}
	}

}
