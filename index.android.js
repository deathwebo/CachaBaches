/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    DeviceEventEmitter,
    TouchableHighlight,
} from 'react-native';
import MapView from 'react-native-maps';

var mSensorManager = require('NativeModules').SensorManager;


class CacheBaches extends Component {

    state = {
        currentPosition: null,
        accelX: null,
        accelY: null,
        accelZ: null,
        shakeTreshold: 10,
        lastUpdate: null
    }

    onPress() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                var currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    latitudeDelta: 0,
                    longitudeDelta: 0,
                }
                this.setState({currentPosition})
            },
            (error) => alert(JSON.stringify(error)),
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
    }

    componentDidMount() {
        console.log('asked for the initial position')
        navigator.geolocation.getCurrentPosition(
            (position) => {
                var currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    latitudeDelta: 0,
                    longitudeDelta: 0,
                }
                this.setState({currentPosition})
                console.log('position retrieved');
            },
            (error) => alert(JSON.stringify(error)),
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );


        mSensorManager.startAccelerometer(100);

        DeviceEventEmitter.addListener('Accelerometer', (data) => {
            if(this.state.accelX == null && this.state.accelY == null
            && this.state.accelZ == null) {
                this.setState({ accelX: data.x});
                this.setState({accelY: data.y});
                this.setState({accelZ: data.z});
            }
            else{
                deltaX = Math.abs(this.state.accelX - data.x);
                deltaY = Math.abs(this.state.accelY - data.y);
                deltaZ = Math.abs(this.state.accelZ - data.z);

                if( (deltaX > this.state.shakeTreshold  && deltaY > this.state.shakeTreshold)
                || (deltaX > this.state.shakeTreshold && deltaZ > this.state.shakeTreshold)
                || (deltaY > this.state.shakeTreshold && deltaZ > this.state.shakeTreshold) ) {
                    var now = Date.now();
                    if(this.state.lastUpdate == null
                        || ( (now - this.state.lastUpdate) > 100 )) {

                        alert('Shake it baby!');
                    }
                }
            }
        });
// mSensorManager.stopAccelerometer();

    }

    render() {
        return (
            <View style={styles.container}>
                <TouchableHighlight
                    style={styles.welcome}
                    onPress={() => this.onPress() }>
                    <Text>Hello!</Text>
                </TouchableHighlight>

                <MapView
                    style={styles.map}
                    showsUserLocation={true}
                    followsUserLocation={true}
                    region={this.state.currentPosition}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    welcome: {
        margin: 10,
        backgroundColor: 'red',
        elevation: 3,
        height: 30,
        width: 50
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});


AppRegistry.registerComponent('CacheBaches', () => CacheBaches);
