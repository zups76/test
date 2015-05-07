import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;


public class DateTest {

	public static void main(String[] args) {
		Calendar c = Calendar.getInstance();

		//
		// 현재 시간에 날짜 부분을 0으로 설정하면 이전 달의 마지막 날짜가 된다.
		c.set(Calendar.DATE, 0);

		// 현재달에서 -1로 이전 달을 셋팅하고, 이전 달의 마지막 날을 셋팅한다. (ActualMaximum 이거 써야함 Maximum 이거 쓰면 현재시간 기준으로 가져옴)
		//c.set(Calendar.MONTH, c.get(Calendar.MONTH)-1);
		//c.set(Calendar.DATE, c.getActualMaximum(Calendar.DATE));

		System.out.println(new SimpleDateFormat("yyyyMM01000000").format(new Date(c.getTimeInMillis())));
		System.out.println(new SimpleDateFormat("yyyyMMdd235959").format(new Date(c.getTimeInMillis())));
	}
}
