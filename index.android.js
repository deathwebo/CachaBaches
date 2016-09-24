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

const typeToColor = new Map([
    [0, '#0000ff'],
    [1, '#ffa500'],
    [2, '#ffff00'],
    [3, '#ff0000']
]);

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
        currentPothole: null,
        thanksModalVisible: false,
        manualPothole: null,
        confirmManualPotholeVisible: false
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

    setThanksModalVisible(visible) {
        if(visible) {
            this.setState({newPotholeVisible: false});
        }

        this.setState({thanksModalVisible: visible});
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

    saveCurrentPothole(potholeType) {
        let pothole = this.state.currentPothole;
        pothole.potholeType = potholeType;
        this.setState({potholes: this.state.potholes.concat(pothole)});
        this.setNewPotholeVisible(false);

        this.setState({currentPosition: {
            latitude: pothole.latitude,
            longitude: pothole.longitude,
            latitudeDelta: 0.10,
            longitudeDelta: 0.10,
        }});

        this.setThanksModalVisible(true);
    }

    createManualPothole(coordinate) {
        this.setState({currentPosition: {
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            latitudeDelta: 0,
            longitudeDelta: 0,
        }});

        this.setState({manualPothole: {
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
        }});

        this.setState({confirmManualPotholeVisible: true});
    }

    manualPotholeConfirmed() {
        this.setState({confirmManualPotholeVisible: false});

        this.setState({currentPothole: this.state.manualPothole});

        this.setNewPotholeVisible(true);

        this.setState({manualPothole: null});
    }

    manualPotholeCanceled() {

        this.setState({confirmManualPotholeVisible: false});

        this.setState({manualPothole: null});
    }

    componentDidMount() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                var currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    latitudeDelta: 0.10,
                    longitudeDelta: 0.10,
                }
                this.setState({currentPosition})
            },
            (error) => alert(JSON.stringify(error)),
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );


        mSensorManager.startAccelerometer(100);

        DeviceEventEmitter.addListener('Accelerometer', (data) => {

            if(this.state.newPotholeVisible || this.state.potholeQuestionVisible) {
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

                <View style={styles.counter}>
                    <Text style={{ color: '#fff', fontSize: 20 }}>{ this.state.potholes.length }</Text>
                </View>

                <MapView
                    style={styles.map}
                    showsUserLocation={true}
                    followsUserLocation={true}
                    region={this.state.currentPosition}
                    onPress={(data) => { this.createManualPothole(data.nativeEvent.coordinate); }}
                >
                    {this.state.manualPothole &&
                        <MapView.Marker
                            coordinate={{
                                latitude: this.state.manualPothole.latitude,
                                longitude: this.state.manualPothole.longitude,
                            }}
                        />
                    }

                    {this.state.potholes.map(pothole => (
                        <MapView.Marker
                            coordinate={{
                                latitude: pothole.latitude,
                                longitude: pothole.longitude
                            }}
                            title="My Title"
                            description="My description"
                            pinColor={typeToColor.get(pothole.potholeType)}
                        />
                    ))}
                </MapView>

                <Modal
                    animationType={"slide"}
                    transparent={true}
                    visible={this.state.confirmManualPotholeVisible}
                    onRequestClose={() => {  }}
                >
                    <View style={styles.questionMenu}>
                        <TouchableHighlight
                            style={[styles.green, styles.confirmManualMenuItem]}
                            onPress={() => { this.manualPotholeConfirmed() }}
                        >
                            <Text style={{ color: '#fff', fontSize: 23 }}>GUARDAR</Text>
                        </TouchableHighlight>

                        <TouchableHighlight
                            style={[styles.red, styles.confirmManualMenuItem]}
                            onPress={() => { this.manualPotholeCanceled() }}
                        >
                            <Text style={{ color: '#fff', fontSize: 23 }}>DESCARTAR</Text>
                        </TouchableHighlight>

                    </View>
                </Modal>

                <Modal
                    animationType={"slide"}
                    transparent={false}
                    visible={this.state.thanksModalVisible}
                    onRequestClose={() => {  }}
                >
                    <View style={{flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={{fontSize: 30}}>GRACIAS POR TU REPORTE :)</Text>
                        <Text style={{fontSize: 23}}>¡Acabas de ganar 100 bachepuntos!</Text>
                        <TouchableHighlight
                            style={{ backgroundColor: '#ADD8E6'}}
                            onPress={() => { this.setState({thanksModalVisible: false}) }}
                        >
                            <Text style={{ color: '#fff', fontSize: 40 }}>Regresar</Text>
                        </TouchableHighlight>
                    </View>
                </Modal>

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
                                this.saveCurrentPothole(0);
                            }}
                                style={[styles.blue, styles.menuItem]}
                            >
                                <Text style={styles.menuItemText}>Simple</Text>
                            </TouchableHighlight>

                            <TouchableHighlight onPress={() => {
                                this.saveCurrentPothole(1);
                            }}
                                style={[styles.orange, styles.menuItem]}
                            >
                                <Text style={styles.menuItemText}>Cráter</Text>
                            </TouchableHighlight>

                            <TouchableHighlight onPress={() => {
                                this.saveCurrentPothole(2);
                            }}
                                style={[styles.yellow, styles.menuItem]}
                            >
                                <Text style={styles.menuItemText}>Varios</Text>
                            </TouchableHighlight>

                            <TouchableHighlight onPress={() => {
                                this.saveCurrentPothole(3);
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
    counter: {
        margin: 10,
        backgroundColor: 'blue',
        elevation: 3,
        height: 30,
        width: 30
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
    green: {
        backgroundColor: 'green'
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    questionMenuYes: {
        backgroundColor: 'red'
    },
    questionMenuNo: {
        backgroundColor: 'green'
    },
    confirmManualMenuItem: {
        flex: 1,
        margin: 20,
        padding: 5,
        alignItems: 'center',
        justifyContent: 'center'
    }
});


AppRegistry.registerComponent('CacheBaches', () => CacheBaches);
