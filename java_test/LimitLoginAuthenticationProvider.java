/**
 * LimitLoginAuthenticationProvider.java
 * 2015. 5. 22.
 */
package java_test;

import insoft.serviceportal.util.login.dao.LoginDao;
import insoft.serviceportal.web.vo.UserVo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.authentication.encoding.ShaPasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * Cloud Mesh :
 * 
 * @since 2015. 5. 22.
 * 
 *        <pre>
 * << 개정이력(Modification Information) >>
 *   
 *   수정일      수정자           수정내용
 *  -------       --------    ---------------------------
 * 
 * </pre>
 */
@Component("authenticationProvider")
public class LimitLoginAuthenticationProvider extends DaoAuthenticationProvider {

	@Autowired
	LoginDao dao;

//	public LimitLoginAuthenticationProvider() {
//		ShaPasswordEncoder sha = new ShaPasswordEncoder(256);
//		sha.setEncodeHashAsBase64(true);
//		setPasswordEncoder(sha);
//	}

//	@Autowired
//	public void setPasswordEncoder(ShaPasswordEncoder passwordEncoder) {
//		passwordEncoder.setEncodeHashAsBase64(true);
//		super.setPasswordEncoder(passwordEncoder);
//	}

	@Autowired
	@Qualifier("userDetailService")
	public void setUserDetailsService(UserDetailsService userDetailsService) {
		super.setUserDetailsService(userDetailsService);
	}

	@Override
	public Authentication authenticate(Authentication authentication)
			throws AuthenticationException {

		try {

			System.out.println("----------------------asdaasd");
			Authentication auth = super.authenticate(authentication);

			// if reach here, means login success, else an exception will be
			// thrown
			// reset the user_attempts
//			userDetailsDao.resetFailAttempts(authentication.getName());

			return auth;

		} catch (BadCredentialsException e) {

			// invalid login, update to user_attempts
//			userDetailsDao.updateFailAttempts(authentication.getName());
			throw e;

		} catch (LockedException e) {

			// this user is locked!
			String error = "";
			UserVo userAttempts = null;//userDetailsDao.getUserAttempts(authentication.getName());

			if (userAttempts != null) {
//				Date lastAttempts = userAttempts.getLastModified();
//				error = "User account is locked! <br><br>Username : "
//						+ authentication.getName() + "<br>Last Attempts : "
//						+ lastAttempts;
				;
			} else {
				error = e.getMessage();
			}

			throw new LockedException(error);
		}

	}
}
