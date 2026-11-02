/* ============================================================
 * 模組一：天文計算（太陽黃經、十二節時刻）
 *   以太陽視黃經演算法推算節氣，再以逐年校正表(分鐘)修正至 ±1 分鐘
 * ============================================================ */
const Astro = (function () {
    const RAD = Math.PI / 180;
    const TERM_LON = [285, 315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255]; // 小寒~大雪
    const TERM_NAME = ["小寒", "立春", "驚蟄", "清明", "立夏", "芒種", "小暑", "立秋", "白露", "寒露", "立冬", "大雪"];
    const FIX_START = 1899;
    const FIX_TABLE = "jjkkjihijkjigeeffghknomjfcdhloqrrrrpmkjjjhfddfjmmljhfefgilnoomkjiikmnonmmmnnmkihhhhghjmpqqnllmnoonnmmkighkmonljihiijjjjihhhjmprrpnlklnoonkhedddegijjhfefikkhfdeghjkmopoliffhjjhffgggfefgikkjjknppnkhfefghkmopomjfdegijjiijlnoooopppooqsusoiedfhklmnonlifgikkkiikmpqqpnmmlllnpqoliecbdgjlnoppomkjiiiiiijmopolifeeffgjmnmiebbdhkmoqssromkjigecdgknoolhebabehkllljhgghknoonnoqqqnifdeeegjnpqokhghkllllmmmkjjkmonmllmmlkigfeefgjmqssrolkkmoppomkjiihijkljhgiklkhdbbdgjmpsusplihjmnljijjjihgghiihijmoolifddfiloqssrplhffgijihhijkkkjkmoonnprsrnieegknopppnjfccegihgghjlnnnnmmmmnprrplheccehlnnmlkihgffffghijmoqpnkihijkklmlkhdbbehlnnoqqpnmkkjjjiiknqsrplifefhijjjjihhhjmqrrpooqssqnkiiiijlorrokhghklljiijjjklnpqpomlmnnmkhgffghjlnoonljiijlmlkjjjkkkklmmkiggijjgcaabdgilprrplhhjlnmjijklllkkjihfefilmkhecceiloprrrqpmlkkkkjihjmopnmllmmllmoqqoliiknprrrrqolihhihhgghjloppomlkkmorssqnkihiknppnlkjihgecccdegkpstqmjhijklmnonlhfefhijjklnnnljhgfffhkosuusokgeeghijjkkjhggilnnmmnpstrnkiijlmosuurmheegijihiijjklmnooonnprtrolighilnprrqoliggikllllmnonnmmnonmlmnonjfcbdgiknqsspkgfhkmnnmnopponmmljihikmnliebacglpqqqpomlkklmnnllmorroljjjkkllmnmjgffjmqrsrrqpmjiiijjjjjklmmlkjihikmpqpomjhhjlprsqoljihfeccddefjnqqnjgfgjmopqqqnliijmnnnmmmnmmjhfeegilpsuutqmjjkmnnnmmnnljjkmnnmklnprqnlklnopqsvvtpkhhjkkihhhhhijlmnmlkkmoqrpmkjjkmoqrqpnkhfghjjigfgjmnmlllmlkkloppmjgfgijjkmoonkhghjkkjjkmpqrrqpnmkiikmnnmjgdegjmnnnnnnnnooppommnquwvspmllllmnonlihhknpqpppqqqpponmmllmoqqrqnlihijlnoonnlkjjloqrqpooonligfffefimpqnjfcceilnoqqpnlkkmoonmmnopomiebabeimprsqnkhhjmoooopqqpnkklmmlklnqqokgfhjmnpsvwuqmjikmnmllmlkkjjjjjjjkmprsqnkiiknruvwvsolihiklkihikmnmkiijjklosuuqmighknopqrrpmjhhiiihiknprrqomlkklmoqqqolhfefjmnnmmnmllkklmnmmnquvvspmlmnopppolheegjmoonmmmnnnnmllmnoqstsqnkihjloonlkjihghjmpqpooopomjhhijkjlnppnjgeegkmnoppomkkmorssqpprsrqmjgffikmoqqpnkiilprrpooprsrrqrsrqnnprrokhfhjlmnoqrqomlmopponmmmmlllllkkjijlmnmkiggilorsttrpmlklmmliggiklljihggghkorrplihilnpqqrsrpnmlkjhfefiloppoljijkmnpqqqomkjjmoonmmnoonlkjkkjjkosvwuspoopqqqrqplihikmnnnmlmnooonlkjkmpsvwvspmkknppomkjjihhijllkklnpqokgffgijlorsqmiffghiiijklkjijklnnnnoqstrokgeegilnpqqojgegjmmlklnqrrqqqqqpopruvsmhedfikmopqpnkjjklllllnpqqponlkkklnopomjfdceilprsttrolkkkllkkkmppoligfffhjnqqojfdehmprtuvusqomljhgfgilopomifdehkmnoonmkiiknpqqooopomjgffghhilorrpmkklnppppomkihikmnonmkjjjjihgfghkmprttqnlkloqrpmkihgffhjlljhhjmnlhedehjmoqttsokiijmmkjijjjjjjklmnnnnprrqnkihiknpqrrrpmighkmmkjijmopppqrrqpprttsnifgilnoppoljgfgijiihhikmoponmllmnoponkhdbbdhkmmmmnmkjhghiiiijmpqp";

    function deltaT(y) {
        let t;
        if (y < 1900) return 0;
        if (y < 1920) { t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4; }
        if (y < 1941) { t = y - 1920; return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t ** 3; }
        if (y < 1961) { t = y - 1950; return 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547; }
        if (y < 1986) { t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718; }
        if (y < 2005) { t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5; }
        t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t;
    }
    const jdFromMs = ms => ms / 86400000 + 2440587.5;
    const msFromJd = jd => (jd - 2440587.5) * 86400000;

    // 太陽視黃經（度）；輸入為 UT 儒略日
    function sunLongitude(jdUT) {
        const yr = 2000 + (jdUT - 2451545) / 365.25;
        const T = (jdUT + deltaT(yr) / 86400 - 2451545) / 36525;
        const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
        const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
        const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
                + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
        const omega = (125.04 - 1934.136 * T) * RAD;
        const lon = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
        return ((lon % 360) + 360) % 360;
    }
    const wrap180 = d => ((d + 540) % 360) - 180;

    // 民用年 year 內第 idx 個「節」(0=小寒 … 11=大雪) 的 UTC 毫秒
    function termMs(year, idx) {
        const L = TERM_LON[idx];
        const rel = L >= 285 ? L - 360 : L;
        let jd = jdFromMs(Date.UTC(year, 2, 20, 12)) + rel / 360 * 365.2422;
        for (let i = 0; i < 10; i++) {
            const diff = wrap180(L - sunLongitude(jd));
            jd += diff / 0.9856474;
            if (Math.abs(diff) < 1e-8) break;
        }
        let ms = msFromJd(jd);
        const k = year - FIX_START;
        if (k >= 0 && k * 12 + idx < FIX_TABLE.length) ms += (parseInt(FIX_TABLE[k * 12 + idx], 36) - 18) * 60000;
        return ms;
    }
    // 取得 ms 前後最近的「節」
    function nearestTerms(ms) {
        const y = new Date(ms).getUTCFullYear();
        const list = [];
        for (let yy = y - 1; yy <= y + 1; yy++) for (let i = 0; i < 12; i++) list.push({ ms: termMs(yy, i), name: TERM_NAME[i], year: yy, idx: i });
        list.sort((a, b) => a.ms - b.ms);
        let prev = list[0], next = list[list.length - 1];
        for (const t of list) { if (t.ms <= ms) prev = t; else { next = t; break; } }
        return { prev, next };
    }
    return { sunLongitude, termMs, nearestTerms, jdFromMs, TERM_NAME, TERM_LON };
})();
if (typeof module !== 'undefined') module.exports = Astro;
