<template>
	<view class="rounded mr-2 px-2 py-1 " 
	:class="disabled ? 'bg-light border' :'main-bg-color'"
	@click="clickEvent">
		<text class="font"
		:class="disabled ? 'text-light-muted' :'text-white'">{{name}}</text>
	</view>
</template>

<script>
	export default {
		props: {
			name: {
				type: String,
				default: ""
			},
			disabled:{
				type: Boolean,
				default: false
			}
		},
		methods:{
			clickEvent(){
				if(!this.disabled){
					this.$emit('click')
				}
			}
		}
	}
</script>

<style>
</style>