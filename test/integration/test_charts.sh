#!/bin/bash

# Integration tests for flexcharts
#
# Using localhost:8082 as default. Server address and port number may be specified as parameters.
#
# To (re-) create expectation files use SETUP as 3rd parameter.
#
# Usage: ./test_charts.sh [server] [port] [mode]

# Return codes:
#   0   All tests passed
#   1   At least one test failed - see log file (./.test_charts.log) for details

# 20.03.2025    MyHomeMyData

function test_curl()  {
    # Get data from flexcharts via curl and evaluate result or create expectation file (mode SETUP)
    # Assign parameters:
    title="$1"      # Title of test case
    addr="$2"       # Server address
    fname="$3"      # File name. Content shall match result of curl
    mode="$4"       # OpMode

    if [ $mode = "SETUP" ]
    then
        # SETUP-Mode => Create expectation file
        echo -n "SETUP Mode. Create expectation file for '$title' ... "
        curl -s -m $TIMEOUT "$addr" > $EXPECT$fname
        ec="$?"
        if [ "$ec" = "0" ]
        then
            echo -e $FMT_GREEN"OK"$FMT_RST
            echo "SETUP Mode. Create expectation file for $title ... OK" >> "$LOG"
            CNT_OK=$(($CNT_OK + 1))
            return "0"
        else
            echo -e $FMT_BOLD$FMT_RED"NOK! curl returned error code "$ec$FMT_RST
            CNT_NOK=$(($CNT_NOK + 1))
            echo "$title ... NOK! curl returned error code $ec" >> $LOG
            return "$ec"
        fi
    fi

    # TEST-Mode => Execute test case
    if [ -e $EXPECT$fname ]
    then
        # Expectation file exists
        echo -n "$title ... "
    else
        # Expectation file missing. Tests makes no sense
        echo -e "$title ... "$FMT_BOLD$FMT_RED"NOK. Expectation file missing. Test case NOT executed."$FMT_RST
        CNT_NOK=$(($CNT_NOK + 1))
        return "112"
    fi

    echo "" > .result       # clear result file
    curl -s -m $TIMEOUT "$addr" > .result
    ec="$?"
    if [ "$ec" = "0" ]
    then
        if [ "$(diff -q .result $EXPECT$fname)" ]
        then
            # Files are different!
            echo -n -e $FMT_BOLD$FMT_RED"NOK! Result does not match expectation."$FMT_RST
            echo "$title ... NOK! Result does not match expectation:" >> "$LOG"
            echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" >> "$LOG"
            echo $(diff .result "$EXPECT$fname") >> "$LOG"
            echo "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<" >> "$LOG"
            mv .result ".result.$fname"
            echo -e " ==> Result file stored to $FMT_BOLD$FMT_RED.result.$fname$FMT_RST"
            ec="111"
        else
            echo -e $FMT_GREEN"OK"$FMT_RST
            echo "$title ... OK" >> "$LOG"
        fi
    else
        echo -e $FMT_BOLD$FMT_RED"NOK! curl returned error code "$ec$FMT_RST
        echo "$title ... NOK! curl returned error code $ec" >> $LOG
    fi

    if [ "$ec" = "0" ]
    then
        CNT_OK=$(($CNT_OK + 1))
    else
        CNT_NOK=$(($CNT_NOK + 1))
    fi

    return $ec
}

##################
# M A I N        #
##################

# Config:
LOG=".test_charts.log"
EXPECT="expect/"    # sub folder for expected data
TIMEOUT=5       # Timeout for curl requests (s)

# Counters:
CNT_OK=0        # Counter tests passed
CNT_NOK=0       # Counter tests failed

# Formatting output:
FMT_RED="\033[31m"
FMT_GREEN="\033[32m"
FMT_BOLD="\033[1m"
FMT_RST="\033[0m"

echo "$(date '+%Y-%m-%d %H:%M:%S') $0 integration test started." > "$LOG"

# Evaluation optional parameters:
HOST="localhost"
PORT="8082"
MODE="TEST"
if [ "$1" != "" ]
then
    HOST="$1"
fi
if [ "$2" != "" ]
then
    PORT="$2"
fi
if [ "$3" != "" ]
then
    MODE="$3"
fi

if [ $MODE = "SETUP" ]
then
    echo -e $FMT_BOLD$FMT_RED"\nSETUP-Mode. Expectation files will be newly created. NO TESTING.\n"$FMT_RST
    echo "SETUP-Mode. Expectation files will be newly created. NO TESTING." >> $LOG
fi

# Initial test:
test_curl "Check for default chart" "http://$HOST:$PORT/flexcharts/echarts.html" "builtin.chart.default" "$MODE"
ec="$?"
if [ "$ec" != "0" ]
then
    # Test failed. Most propably server is not reachable
    echo -e "$FMT_BOLD"$FMT_RED"Fatal error. Error code=$ec. Aborting."$FMT_RST
    echo -e "Fatal error. Error code=$ec. Aborting." >> "$LOG"
    exit "1"
fi 
 
# Do the testing:
test_curl "Check for page 404" "http://$HOST:$PORT/flexcharts/echart.html" "chart.404" "$MODE"
test_curl "Check for requesting unknown state" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.unknown" "info.unknown" "$MODE"
test_curl "Check for flexcharts.0.info.chart1" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart1" "info.chart1.default" "$MODE"
test_curl "Check for flexcharts.0.info.chart1 using 'v5' default theme" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart1&themev5" "info.chart1.default.v5" "$MODE"
test_curl "Check for flexcharts.0.info.chart1 using 'v5' dark theme" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart1&darkmode&themev5" "info.chart1.dark.v5" "$MODE"
test_curl "Check for flexcharts.0.info.chart2" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart2" "info.chart2.default" "$MODE"
test_curl "Check for flexcharts.0.info.chart2 dark mode off" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart2&darkmode=off" "info.chart2.default" "$MODE"
test_curl "Check for flexcharts.0.info.chart2 dark mode bad value" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart2&darkmode=thisisbadvalue" "info.chart2.default" "$MODE"
test_curl "Check for flexcharts.0.info.chart2 dark mode w/o value" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart2&darkmode" "info.chart2.dark" "$MODE"
test_curl "Check for flexcharts.0.info.chart2 dark mode on" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart2&darkmode=on" "info.chart2.dark" "$MODE"
test_curl "Check for flexcharts.0.info.chart2 dark mode auto" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart2&darkmode=auto" "info.chart2.dark_auto" "$MODE"
test_curl "Check for flexcharts.0.info.chart3 using embedded function" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart3" "info.chart3.default" "$MODE"
test_curl "Check for flexcharts.0.info.chart4 using embedded function and theme switching" "http://$HOST:$PORT/flexcharts/echarts.html?source=state&id=flexcharts.0.info.chart4&darkmode=auto" "info.chart4.auto" "$MODE"
test_curl "Check for callback w/o embedded function" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&myjsonparams=\{\"chart\":\"chart1\"\}" "callback.chart1.default" "$MODE"
test_curl "Check for callback w/ embedded function" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&myjsonparams=\{\"chart\":\"chart2\"\}" "callback.chart2.default" "$MODE"
test_curl "Check for callback share_dataset" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&message=demo_share_dataset" "callback.share_dataset.default" "$MODE"
test_curl "Check for callback share_dataset dark mode w/o value" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&message=demo_share_dataset&darkmode" "callback.share_dataset.dark" "$MODE"
test_curl "Check for callback share_dataset dark mode and refresh 2" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&message=demo_share_dataset&darkmode&refresh=2" "callback.share_dataset.dark.rf2" "$MODE"
test_curl "Check for callback share_dataset dark mode w/o value and refresh 10" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&message=demo_share_dataset&darkmode&refresh=10" "callback.share_dataset.dark.rf10" "$MODE"
test_curl "Check for callback share_dataset dark mode on and refresh 10" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&message=demo_share_dataset&darkmode=on&refresh=10" "callback.share_dataset.dark.rf10" "$MODE"
test_curl "Check for callback share_dataset dark mode auto and refresh 10" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&message=demo_share_dataset&darkmode=auto&refresh=10" "callback.share_dataset.dark_auto.rf10" "$MODE"
test_curl "Check for callback using own theme definitions (template5) and dark mode auto" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&message=theme&darkmode=auto" "callback.theme.dark_auto" "$MODE"
test_curl "Check for timeout on callback with wrong message" "http://$HOST:$PORT/flexcharts/echarts.html?source=script&message=message_for_timeout" "callback.timeout" "$MODE"
test_curl "Check for changes in Apache echarts.min.js" "http://$HOST:$PORT/flexcharts/echarts.min.js" "echarts.min.js" "$MODE"
test_curl "Check for changes in Apache echarts-gl.min.js" "http://$HOST:$PORT/flexcharts/echarts-gl.min.js" "echarts-gl.min.js" "$MODE"

# Check for number of failed tests and finalize
if [ "$CNT_NOK" != "0" ]
then
    NOK="$FMT_BOLD$FMT_RED"
    OK=""
    ec="0"
else
    NOK=""
    OK="$FMT_BOLD$FMT_GREEN"
    ec="1"
fi
echo -e "\n$OK$CNT_OK tests passed and $NOK$CNT_NOK tests failed."$FMT_RST
echo "$CNT_OK tests ok and $CNT_NOK tests failed" >> "$LOG"

echo "$(date '+%Y-%m-%d %H:%M:%S') $0 integration test finished." >> "$LOG"

exit "$ec"
