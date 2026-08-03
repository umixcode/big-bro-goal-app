Pod::Spec.new do |s|
  s.name           = 'RestActivity'
  s.version        = '1.0.0'
  s.summary        = 'Bridges the workout rest timer to an iOS Live Activity.'
  s.description    = 'Bridges the workout rest timer to an iOS Live Activity.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
