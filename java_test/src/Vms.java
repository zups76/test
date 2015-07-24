import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "vms")
public class Vms {

	@XmlElement
	List<Vm> vm = new ArrayList<Vm>();;

	public List<Vm> getVm() {
		return vm;
	}

}
