<?php 

class Ajde_Component_Include extends Ajde_Component
{
	public static function processStatic(Ajde_Template_Parser $parser, $attributes)
	{
		$instance = new self($parser, $attributes);
		return $instance->process();
	}
	
	public function process()
	{
		if (!array_key_exists('route', $this->attributes)) {
			// TODO:
			throw new Ajde_Component_Exception();
		}
		$route = $this->attributes['route'];
		if (!$route instanceof Ajde_Core_Route) {
			$route = new Ajde_Core_Route($route);
		}
		return Ajde_Controller::fromRoute($route)->invoke();
	}
}