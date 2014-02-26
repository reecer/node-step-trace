function binarySearch(key, array){
    var low = 0;
    var high = array.length - 1;

    while(low <= high){
        var mid = Math.floor((low+high)/2);
        var value = array[mid];

        if(value < key) 
            low = mid + 1;
        else if(value > key) 
            high = mid - 1;
        else 
            return mid;
    }
    return -1;
}

var items = ["a","b","c","d","e","f","g","h","i","j"];
console.log(binarySearch("i", items));
console.log(binarySearch("b", items));