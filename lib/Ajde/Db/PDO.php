<?php
/**
 * @source http://www.coderholic.com/php-database-query-logging-with-pdo/
 * Modified for use with Ajde_Document_Processor_Html_Debugger
 */

/**
 * Extends PDO and logs all queries that are executed and how long
 * they take, including queries issued via prepared statements
 */
class Ajde_Db_PDO extends PDO
{
    public static $log = [];

    public function __construct($dsn, $username = null, $password = null, $options = [])
    {
        $options = $options + [
                PDO::ATTR_STATEMENT_CLASS => ['Ajde_Db_PDOStatement', [$this]]
            ];
        parent::__construct($dsn, $username, $password, $options);
    }

    public function query($query)
    {
        //$cache = Ajde_Db_Cache::getInstance();
        $log   = ['query' => $query];
        $start = microtime(true);
        //if (!$cache->has($query)) {

        try {
            $result = parent::query($query);
        } catch (Exception $e) {
            if (config("app.debug") === true) {
                if (isset($this->queryString)) {
                    dump($this->queryString);
                }
                dump('Go to ' . config("app.rootUrl") . '?install=1 to install DB');
                throw new Ajde_Db_Exception($e->getMessage());
            } else {
                Ajde_Exception_Log::logException($e);
                die('DB connection problem. <a href="?install=1">Install database?</a>');
            }
        }

        //$cache->set($query, serialize($result));
        //	$log['cache'] = false;
        //} else {
        //	$result = $cache->get($query);
        //	$log['cache'] = true;
        //}
        $time        = microtime(true) - $start;
        $log['time'] = round($time * 1000, 0);
        self::$log[] = $log;

        return $result;
    }

    public static function getLog()
    {
        return self::$log;
    }
}

