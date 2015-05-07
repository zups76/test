import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;


public class DateTest {

	public static void main(String[] args) {
		Calendar c = Calendar.getInstance();

		//c.set(Calendar.DATE, 0);

		c.set(Calendar.MONTH, c.get(Calendar.MONTH)-1);
		c.set(Calendar.DATE, c.getActualMaximum(Calendar.DATE));

		System.out.println(new SimpleDateFormat("yyyyMM01000000").format(new Date(c.getTimeInMillis())));
		System.out.println(new SimpleDateFormat("yyyyMMdd235959").format(new Date(c.getTimeInMillis())));
	}
}
