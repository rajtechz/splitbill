import Foundation
import AVFoundation
import CoreLocation
import UserNotifications
import Contacts
import React

@objc(PermissionManager)
class PermissionManager: NSObject, CLLocationManagerDelegate {
  private var locationManager: CLLocationManager?
  private var locationResolve: RCTPromiseResolveBlock?

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // MARK: - 1. Camera Permission
  @objc
  func requestCameraPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .video) { granted in
      resolve(granted)
    }
  }

  @objc
  func checkCameraPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let status = AVCaptureDevice.authorizationStatus(for: .video)
    resolve(status == .authorized)
  }

  // MARK: - 2. Notification Permission
  @objc
  func requestNotificationPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
      if error != nil {
        resolve(false)
      } else {
        resolve(granted)
      }
    }
  }

  @objc
  func checkNotificationPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      resolve(settings.authorizationStatus == .authorized)
    }
  }

  // MARK: - 3. Location Permission
  @objc
  func requestLocationPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      self.locationManager = CLLocationManager()
      self.locationManager?.delegate = self
      self.locationResolve = resolve
      self.locationManager?.requestWhenInUseAuthorization()
    }
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    let status = manager.authorizationStatus
    if status != .notDetermined {
      locationResolve?(status == .authorizedWhenInUse || status == .authorizedAlways)
      locationResolve = nil
    }
  }

  @objc
  func checkLocationPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let status = CLLocationManager().authorizationStatus
    resolve(status == .authorizedWhenInUse || status == .authorizedAlways)
  }

  // MARK: - 4. Contacts Permission
  @objc
  func requestContactsPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    CNContactStore().requestAccess(for: .contacts) { granted, _ in
      resolve(granted)
    }
  }

  @objc
  func checkContactsPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let status = CNContactStore.authorizationStatus(for: .contacts)
    resolve(status == .authorized)
  }
}

