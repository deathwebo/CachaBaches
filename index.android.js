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
    Modal
} from 'react-native';
import MapView from 'react-native-maps';

var mSensorManager = require('NativeModules').SensorManager;


class CacheBaches extends Component {

    state = {
        currentPosition: null,
        accelX: null,
        accelY: null,
        accelZ: null,
        shakeThreshold: 10,
        lastUpdate: null,
        newPotholeVisible: false,
        potholeQuestionVisible: false,
        potholes: [],
        currentPothole: null
    }

    setPotholeQuestionVisible(visible) {
        this.setState({potholeQuestionVisible: visible});
    }

    setNewPotholeVisible(visible) {
        if(visible) {
            this.setState({potholeQuestionVisible: false});
        }

        this.setState({newPotholeVisible: visible})
    }

    setCurrentPothole() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                var currentPothole = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }
                this.setState({currentPothole});

                this.setPotholeQuestionVisible(true);
            },
            (error) => alert(JSON.stringify(error)),
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
    }

    saveCurrentPothole() {

    }

    componentDidMount() {
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


        mSensorManager.startAccelerometer(100);

        DeviceEventEmitter.addListener('Accelerometer', (data) => {

            if(this.state.newPotholeVisible) {
                return;
            }

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

                if( (deltaX > this.state.shakeThreshold  && deltaY > this.state.shakeThreshold)
                || (deltaX > this.state.shakeThreshold && deltaZ > this.state.shakeThreshold)
                || (deltaY > this.state.shakeThreshold && deltaZ > this.state.shakeThreshold) ) {
                    var now = Date.now();
                    if(this.state.lastUpdate == null
                        || ( (now - this.state.lastUpdate) > 100 )) {

                        this.setCurrentPothole();
                    }
                }
            }
        });

    }

    render() {
        return (
            <View style={styles.container}>

                <MapView
                    style={styles.map}
                    showsUserLocation={true}
                    followsUserLocation={true}
                    region={this.state.currentPosition}
                />

                <Modal
                    animationType={"slide"}
                    transparent={false}
                    visible={this.state.potholeQuestionVisible}
                    onRequestClose={() => {  }}
                >
                    <Text style={{ fontSize: 30 }}>
                        ¿Eso fue un bache?
                    </Text>

                    <View style={{ flex: 1, flexDirection: 'row'}}>
                        <TouchableHighlight
                            style={[ styles.questionMenu, styles.questionMenuNo]}
                            onPress={() => { this.setPotholeQuestionVisible(false) } }>
                            <Text style={{ fontSize: 30, color: 'white' }} >NO</Text>
                        </TouchableHighlight>

                        <TouchableHighlight
                            style={[ styles.questionMenu, styles.questionMenuYes]}
                            onPress={() => { this.setNewPotholeVisible(true) } }>
                            <Text style={{ fontSize: 30, color: 'white' }} >SI</Text>
                        </TouchableHighlight>
                    </View>

                </Modal>


                <Modal
                    animationType={"slide"}
                    transparent={false}
                    visible={this.state.newPotholeVisible}
                    onRequestClose={() => { console.log('modal closed') }}
                >
                    <View style={{marginTop: 22, flex: 1, flexDirection: 'column'}}>

                        <View style={styles.menuHeader}>
                            <Text style={{ fontSize: 25}}>Nuevo Bache</Text>
                            <Text style={{ fontSize: 22}}>Selecciona el tipo de bache</Text>
                        </View>

                        <View style={styles.menuContainer}>
                            <TouchableHighlight onPress={() => {

                            }}
                                style={[styles.blue, styles.menuItem]}
                            >
                                <Text style={styles.menuItemText}>Simple</Text>
                            </TouchableHighlight>

                            <TouchableHighlight onPress={() => {
                            }}
                                style={[styles.orange, styles.menuItem]}
                            >
                                <Text style={styles.menuItemText}>Cráter</Text>
                            </TouchableHighlight>

                            <TouchableHighlight onPress={() => {
                            }}
                                style={[styles.yellow, styles.menuItem]}
                            >
                                <Text style={styles.menuItemText}>Varios</Text>
                            </TouchableHighlight>

                            <TouchableHighlight onPress={() => {
                            }}
                                style={[styles.red, styles.menuItem]}
                            >
                                <Text style={styles.menuItemText}>Campo minado</Text>
                            </TouchableHighlight>

                        </View>
                    </View>
                </Modal>

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
    menuHeader: {
        flex: 1,
        alignItems: 'center'
    },
    menuContainer: {
        flex: 4,
        flexDirection: 'column',
    },
    menuItem: {
        flex: 4,
        margin: 20,
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 22,
        color: 'white'
    },
    blue: {
        backgroundColor: 'blue'
    },
    orange: {
        backgroundColor: 'orange'
    },
    yellow: {
        backgroundColor: '#FFE135'
    },
    red: {
        backgroundColor: 'red'
    },
    questionMenu: {
        flex:1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    questionMenuYes: {
        backgroundColor: 'red'
    },
    questionMenuNo: {
        backgroundColor: 'green'
    }
});


AppRegistry.registerComponent('CacheBaches', () => CacheBaches);
