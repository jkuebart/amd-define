define([ './sub0', 'mod/sub1' ], function (sub0, sub1) {
    return { 'hello': sub0.hello +', '+ sub1.hello };
});
