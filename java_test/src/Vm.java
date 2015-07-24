import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "vm")
public class Vm {

	String name;
	String cpu_usage;
	String mem_usage;
	String disk_usage;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getCpu_usage() {
		return cpu_usage;
	}

	public void setCpu_usage(String cpu_usage) {
		this.cpu_usage = cpu_usage;
	}

	public String getMem_usage() {
		return mem_usage;
	}

	public void setMem_usage(String mem_usage) {
		this.mem_usage = mem_usage;
	}

	public String getDisk_usage() {
		return disk_usage;
	}

	public void setDisk_usage(String disk_usage) {
		this.disk_usage = disk_usage;
	}
}
