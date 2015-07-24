package java_test;

import insoft.serviceportal.ext.springframework.filter.CloudmeshAuthenticationFilter;
import insoft.serviceportal.util.login.UserDetailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.EnvironmentAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.encoding.ShaPasswordEncoder;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.AbstractAuthenticationProcessingFilter;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter implements EnvironmentAware {

	@Autowired
	UserDetailService userDetailsService;

	@Autowired
	@Qualifier("authenticationProvider")
	AuthenticationProvider authenticationProvider;

	@Autowired
	public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
		auth.authenticationProvider(authenticationProvider).userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
//		auth.authenticationProvider(authenticationProvider);
	}

	/*@Override
	protected void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
	}*/

	@Bean
    public ShaPasswordEncoder passwordEncoder() {
        return new ShaPasswordEncoder(256);
    }

	/*@Bean
	public AbstractAuthenticationProcessingFilter getAuthenticationFilter() {
		CloudmeshAuthenticationFilter filter = new CloudmeshAuthenticationFilter("/j_spring_security_check.do");
		return filter;
	}*/
	@Override
	protected void configure(HttpSecurity http) throws Exception {

		http
			.csrf()
			.disable()
//			.addFilterBefore(getAuthenticationFilter(), BasicAuthenticationFilter.class)
			// 로그인
			.formLogin()
			.loginProcessingUrl("/j_spring_security_check.do")
			.loginPage("/login/login.do")
//			.usernameParameter("")
//			.passwordParameter("")
			.successHandler(new SimpleUrlAuthenticationSuccessHandler("/home.do"))
			.failureUrl("/login/accessdenied.do")
			.and()
			// 로그아웃
			.logout()
			.logoutUrl("/j_spring_security_logout.do")
			.logoutSuccessUrl("/login/login.do")
			.invalidateHttpSession(true)
			.and()
			.authorizeRequests()
			.antMatchers("/admin/**").access("hasRole('ROLE_ADMIN')")
			.antMatchers("/dba/**").access("hasRole('ROLE_ADMIN') or hasRole('ROLE_DBA')")

			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/survey/**").permitAll()
			.antMatchers("/common/policy**").permitAll()
			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/**/*.html").permitAll()
			.antMatchers("/error/**/*").permitAll()
			.antMatchers("/public/**/*").permitAll()
			.antMatchers("/mon_report/**/*").permitAll()
			.antMatchers("/help/**/*").permitAll()
			.antMatchers("/goPage*").permitAll()
			.antMatchers("/j_spring_security*").permitAll()
			.antMatchers("/index.*").permitAll()
			.antMatchers("/login/*").permitAll()
			.antMatchers("/css/**/*").permitAll()
			.antMatchers("/image/**/*").permitAll()
			.antMatchers("/images/**/*").permitAll()
			.antMatchers("/js/**/*").permitAll()
			.antMatchers("/map/**/*").permitAll()

			.antMatchers("/map/Map.swf").authenticated()
			.antMatchers("/**").authenticated()

			.and()
			.httpBasic().authenticationEntryPoint(authenticationEntryPoint())
			.and()
			.sessionManagement()
			.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
			.maximumSessions(1)
			.maxSessionsPreventsLogin(true)
			.expiredUrl("/error/session-expired.html")
			;
	}

	private AuthenticationEntryPoint authenticationEntryPoint() {
		LoginUrlAuthenticationEntryPoint entryPoint = new LoginUrlAuthenticationEntryPoint("/login/goLogin.do");
		entryPoint.setForceHttps(isForceHttps());
		return entryPoint;
	}

	private Environment environment;

	private boolean isForceHttps() {
		return !environment.acceptsProfiles("STANDALONE");
	}

	@Override
	public void setEnvironment(Environment environment) {
		this.environment = environment;
	}
}