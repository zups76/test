/**
 * Cloud Mesh : 공통 VO
 * 
 * @since 2015. 2. 12.
 * 
 *        <pre>
 * << 개정이력(Modification Information) >>
 *   
 *   수정일      수정자           수정내용
 *  -------       --------    ---------------------------
 * 
 * </pre>
 */
public class BaseVo {

	private BaseVo base_vo;
	private String site_id = "1";
	private String site_nm = "";
	private String user_id;
	private String user_nm;

	private String dept_id;
	private String dept_nm;

	private String create_dt = "";
	private String create_dtm = "";
	private String create_user_id = "";
	private String create_user_nm = "";

	private String update_dt = "";
	private String update_dtm = "";
	private String update_user_id = "";
	private String update_user_nm = "";

	public BaseVo getBase_vo() {
		return base_vo;
	}

	public void setBase_vo(BaseVo base_vo) {
		this.base_vo = base_vo;
	}

	public String getSite_id() {
		return site_id;
	}

	public void setSite_id(String site_id) {
		this.site_id = site_id;
	}

	public String getSite_nm() {
		return site_nm;
	}

	public void setSite_nm(String site_nm) {
		this.site_nm = site_nm;
	}

	public String getUser_id() {
		return user_id;
	}

	public void setUser_id(String user_id) {
		this.user_id = user_id;
	}

	public String getUser_nm() {
		return user_nm;
	}

	public void setUser_nm(String user_nm) {
		this.user_nm = user_nm;
	}

	public String getDept_id() {
		return dept_id;
	}

	public void setDept_id(String dept_id) {
		this.dept_id = dept_id;
	}

	public String getDept_nm() {
		return dept_nm;
	}

	public void setDept_nm(String dept_nm) {
		this.dept_nm = dept_nm;
	}

	public String getCreate_dt() {
		return create_dt;
	}

	public void setCreate_dt(String create_dt) {
		this.create_dt = create_dt;
	}

	public String getCreate_dtm() {
		return create_dtm;
	}

	public void setCreate_dtm(String create_dtm) {
		this.create_dtm = create_dtm;
	}

	public String getCreate_user_id() {
		return create_user_id;
	}

	public void setCreate_user_id(String create_user_id) {
		this.create_user_id = create_user_id;
	}

	public String getCreate_user_nm() {
		return create_user_nm;
	}

	public void setCreate_user_nm(String create_user_nm) {
		this.create_user_nm = create_user_nm;
	}

	public String getUpdate_dt() {
		return update_dt;
	}

	public void setUpdate_dt(String update_dt) {
		this.update_dt = update_dt;
	}

	public String getUpdate_dtm() {
		return update_dtm;
	}

	public void setUpdate_dtm(String update_dtm) {
		this.update_dtm = update_dtm;
	}

	public String getUpdate_user_id() {
		return update_user_id;
	}

	public void setUpdate_user_id(String update_user_id) {
		this.update_user_id = update_user_id;
	}

	public String getUpdate_user_nm() {
		return update_user_nm;
	}

	public void setUpdate_user_nm(String update_user_nm) {
		this.update_user_nm = update_user_nm;
	}

}